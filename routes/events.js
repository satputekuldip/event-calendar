var express = require('express');
var router = express.Router();
var pool = require('../config/database');

/* POST create new event */
router.post('/', function(req, res, next) {
	var body = req.body;
	
	// Validate required fields
	if (!body.date || !body.title) {
		return res.status(400).json({
			error: 'Missing required fields',
			message: 'date and title are required'
		});
	}
	
	// Validate date format (YYYY-MM-DD)
	var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
	if (!dateRegex.test(body.date)) {
		return res.status(400).json({
			error: 'Invalid date format',
			message: 'date must be in YYYY-MM-DD format'
		});
	}
	
	// Validate priority if provided
	var validPriorities = ['low', 'medium', 'high'];
	var priority = body.priority || 'medium';
	if (validPriorities.indexOf(priority.toLowerCase()) === -1) {
		return res.status(400).json({
			error: 'Invalid priority',
			message: 'priority must be one of: low, medium, high'
		});
	}
	priority = priority.toLowerCase();
	
	// Validate all_day flag
	var allDay = Boolean(body.all_day);
	
	// Validate and format times
	var startTime = null;
	var endTime = null;
	
	if (!allDay) {
		// For timed events, validate time format
		if (body.start_time) {
			var timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
			if (!timeRegex.test(body.start_time)) {
				return res.status(400).json({
					error: 'Invalid start_time format',
					message: 'start_time must be in HH:MM or HH:MM:SS format'
				});
			}
			// Normalize to HH:MM:SS format
			var timeParts = body.start_time.split(':');
			startTime = timeParts[0] + ':' + timeParts[1] + ':' + (timeParts[2] || '00');
		}
		
		if (body.end_time) {
			var timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
			if (!timeRegex.test(body.end_time)) {
				return res.status(400).json({
					error: 'Invalid end_time format',
					message: 'end_time must be in HH:MM or HH:MM:SS format'
				});
			}
			// Normalize to HH:MM:SS format
			var timeParts = body.end_time.split(':');
			endTime = timeParts[0] + ':' + timeParts[1] + ':' + (timeParts[2] || '00');
		}
	}
	
	// Prepare query
	var query = `
		INSERT INTO calendar_events 
		(date, title, description, start_time, end_time, priority, all_day)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING 
			id,
			date::text as date,
			title,
			COALESCE(description, '') as description,
			start_time::text as start_time,
			end_time::text as end_time,
			COALESCE(priority, 'medium') as priority,
			COALESCE(all_day, false) as all_day
	`;
	
	var params = [
		body.date,
		body.title,
		body.description || '',
		startTime,
		endTime,
		priority,
		allDay
	];
	
	pool.query(query, params, function(err, result) {
		if (err) {
			console.error('Database insert error:', err);
			return res.status(500).json({
				error: 'Database error',
				message: err.message
			});
		}
		
		var event = result.rows[0];
		res.status(201).json({
			id: event.id,
			date: event.date,
			title: event.title,
			description: event.description || '',
			start_time: event.start_time || '',
			end_time: event.end_time || '',
			priority: event.priority,
			all_day: Boolean(event.all_day)
		});
	});
});

/* DELETE event by id - Must be before GET /:date to avoid route conflicts */
router.delete('/:id', function(req, res, next) {
	var eventId = parseInt(req.params.id, 10);
	
	// Validate event ID
	if (isNaN(eventId) || eventId <= 0) {
		return res.status(400).json({
			error: 'Invalid event ID',
			message: 'Event ID must be a positive integer'
		});
	}
	
	var query = `
		DELETE FROM calendar_events
		WHERE id = $1
		RETURNING id
	`;
	
	pool.query(query, [eventId], function(err, result) {
		if (err) {
			console.error('Database delete error:', err);
			return res.status(500).json({
				error: 'Database error',
				message: err.message
			});
		}
		
		// Check if event was found and deleted
		if (result.rows.length === 0) {
			return res.status(404).json({
				error: 'Event not found',
				message: 'No event found with the specified ID'
			});
		}
		
		res.status(200).json({
			message: 'Event deleted successfully',
			id: result.rows[0].id
		});
	});
});

/* GET events by date */
router.get('/:date', function(req, res, next) {
	var date = req.params.date;
	
	// Validate date format (YYYY-MM-DD)
	var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
	if (!dateRegex.test(date)) {
		return res.status(400).json({ 
			error: 'Invalid date format. Expected YYYY-MM-DD' 
		});
	}

	var query = `
		SELECT 
			id,
			date::text as date,
			title,
			COALESCE(description, '') as description,
			start_time::text as start_time,
			end_time::text as end_time,
			COALESCE(priority, 'medium') as priority,
			COALESCE(all_day, false) as all_day
		FROM calendar_events
		WHERE date::text = $1
		ORDER BY 
			CASE WHEN all_day = true THEN 0 ELSE 1 END,
			start_time ASC
	`;

	pool.query(query, [date], function(err, result) {
		if (err) {
			console.error('Database query error:', err);
			return res.status(500).json({ 
				error: 'Database error',
				message: err.message 
			});
		}

		// Format the response to ensure consistent data types
		var formattedRows = result.rows.map(function(row) {
			return {
				id: row.id,
				date: row.date,
				title: row.title || '',
				description: row.description || '',
				start_time: row.start_time || '',
				end_time: row.end_time || '',
				priority: row.priority || 'medium',
				all_day: Boolean(row.all_day)
			};
		});

		res.json(formattedRows);
	});
});

module.exports = router;


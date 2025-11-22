var express = require('express');
var router = express.Router();
var pool = require('../config/database');

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


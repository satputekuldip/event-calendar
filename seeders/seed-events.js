require('dotenv').config();
const pool = require('../config/database');

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
	return date.toISOString().split('T')[0];
}

// Helper function to get day of week (0 = Sunday, 1 = Monday, etc.)
function getDayOfWeek(date) {
	return date.getDay();
}

// Helper function to get the next Monday from a given date
function getNextMonday(startDate) {
	const date = new Date(startDate);
	const day = date.getDay();
	const diff = day === 0 ? 1 : (8 - day); // If Sunday, add 1; otherwise add days to reach Monday
	date.setDate(date.getDate() + diff);
	date.setHours(0, 0, 0, 0);
	return date;
}

// Helper function to add days to a date
function addDays(date, days) {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

// Generate events for a 4-week cycle starting from the next Monday
function generateMonthlySchedule(startDate) {
	const events = [];
	const startMonday = getNextMonday(startDate);
	
	// Generate 4 weeks (28 days)
	for (let week = 0; week < 4; week++) {
		const weekStart = addDays(startMonday, week * 7);
		
		// Week 1: Drawing/Art (Mon-Tue), Open Source (Wed-Thu), Homelab (Fri-Sat), Entertainment (Sun)
		// Week 2: Entertainment (Mon-Tue), Learning (Wed-Thu), Go Outside (Fri-Sat), Magic Stack FULL DAY (Sun)
		// Week 3: Drawing/Art (Mon-Tue), Open Source (Wed-Thu), Homelab (Fri-Sat), Entertainment (Sun)
		// Week 4: Entertainment (Mon-Tue), Learning (Wed-Thu), Magic Stack evening (Fri-Sat), Magic Stack FULL DAY (Sun)
		
		const isWeek2 = week === 1;
		const isWeek4 = week === 3;
		
		// Monday
		const monday = addDays(weekStart, 0);
		addMorningEvents(events, monday);
		if (isWeek2 || isWeek4) {
			addEveningEvent(events, monday, 'Entertainment – Show/Movie');
		} else {
			addEveningEvent(events, monday, 'Drawing / Art');
		}
		
		// Tuesday
		const tuesday = addDays(weekStart, 1);
		addMorningEvents(events, tuesday);
		if (isWeek2 || isWeek4) {
			addEveningEvent(events, tuesday, 'Entertainment – Show/Movie');
		} else {
			addEveningEvent(events, tuesday, 'Drawing / Art');
		}
		
		// Wednesday
		const wednesday = addDays(weekStart, 2);
		addMorningEvents(events, wednesday);
		if (isWeek2 || isWeek4) {
			addEveningEvent(events, wednesday, 'Learning Course');
		} else {
			addEveningEvent(events, wednesday, 'Open Source Contribution');
		}
		
		// Thursday
		const thursday = addDays(weekStart, 3);
		addMorningEvents(events, thursday);
		if (isWeek2 || isWeek4) {
			addEveningEvent(events, thursday, 'Learning Course');
		} else {
			addEveningEvent(events, thursday, 'Open Source Contribution');
		}
		
		// Friday
		const friday = addDays(weekStart, 4);
		addMorningEvents(events, friday);
		if (isWeek4) {
			addEveningEvent(events, friday, 'Magic Stack Project Work', '20:30:00', '23:30:00');
		} else if (isWeek2) {
			addEveningEvent(events, friday, 'Go Outside / Movie');
		} else {
			addEveningEvent(events, friday, 'Homelab Project');
		}
		
		// Saturday
		const saturday = addDays(weekStart, 5);
		addMorningEvents(events, saturday);
		if (isWeek4) {
			addEveningEvent(events, saturday, 'Magic Stack Project Work', '17:30:00', '23:30:00');
		} else if (isWeek2) {
			addEveningEvent(events, saturday, 'Go Outside / Movie', '17:30:00', '23:30:00');
		} else {
			addEveningEvent(events, saturday, 'Homelab Project', '17:30:00', '23:30:00');
		}
		
		// Sunday - ALL SUNDAYS ARE ALL-DAY EVENTS (except Reading and Exercise)
		const sunday = addDays(weekStart, 6);
		
		// Add morning events for Sunday (Exercise: 1 hour, Reading: 3 hours)
		addSundayMorningEvents(events, sunday);
		
		if (isWeek2 || isWeek4) {
			// Magic Stack FULL DAY
			events.push({
				date: formatDate(sunday),
				title: 'Magic Stack Project Work',
				description: 'Full day Magic Stack project work',
				start_time: null,
				end_time: null,
				priority: 'high',
				all_day: true
			});
		} else {
			// Entertainment - ALL DAY
			events.push({
				date: formatDate(sunday),
				title: 'Entertainment – Show/Movie',
				description: 'Entertainment – Show/Movie',
				start_time: null,
				end_time: null,
				priority: 'medium',
				all_day: true
			});
		}
		
		// Verify Sunday is actually a Sunday (safety check)
		if (getDayOfWeek(sunday) !== 0) {
			console.warn(`Warning: Expected Sunday but got day ${getDayOfWeek(sunday)} for date ${formatDate(sunday)}`);
		}
	}
	
	// Post-process: Ensure ALL events on Sunday are set to all_day: true
	// EXCEPT Reading and Exercise which should remain time-bound
	events.forEach(event => {
		const eventDate = new Date(event.date);
		if (getDayOfWeek(eventDate) === 0) { // Sunday
			// Don't set Reading and Exercise to all-day - they have specific times
			if (event.title !== 'Reading' && event.title !== 'Exercise') {
				event.all_day = true;
				event.start_time = null;
				event.end_time = null;
			}
		}
	});
	
	return events;
}

// Add morning events (Exercise and Reading) for Mon-Sat
function addMorningEvents(events, date) {
	const dateStr = formatDate(date);
	
	// Exercise: 8:30-9:00 AM
	events.push({
		date: dateStr,
		title: 'Exercise',
		description: 'Morning exercise',
		start_time: '08:30:00',
		end_time: '09:00:00',
		priority: 'medium',
		all_day: false
	});
	
	// Reading: 9:00-10:00 AM
	events.push({
		date: dateStr,
		title: 'Reading',
		description: 'Morning reading time',
		start_time: '09:00:00',
		end_time: '10:00:00',
		priority: 'medium',
		all_day: false
	});
}

// Add morning events for Sunday (Exercise: 1 hour, Reading: 3 hours)
function addSundayMorningEvents(events, date) {
	const dateStr = formatDate(date);
	
	// Exercise: 8:30-9:30 AM (1 hour)
	events.push({
		date: dateStr,
		title: 'Exercise',
		description: 'Morning exercise',
		start_time: '08:30:00',
		end_time: '09:30:00',
		priority: 'medium',
		all_day: false
	});
	
	// Reading: 9:30-12:30 AM (3 hours)
	events.push({
		date: dateStr,
		title: 'Reading',
		description: 'Reading time',
		start_time: '09:30:00',
		end_time: '12:30:00',
		priority: 'medium',
		all_day: false
	});
}

// Add evening event (default Mon-Fri: 8:30-11:30 PM, Sat: 5:30-11:30 PM)
function addEveningEvent(events, date, title, startTime = '20:30:00', endTime = '23:30:00') {
	const dateStr = formatDate(date);
	const dayOfWeek = getDayOfWeek(date);
	
	events.push({
		date: dateStr,
		title: title,
		description: title,
		start_time: startTime,
		end_time: endTime,
		priority: 'medium',
		all_day: false
	});
}

async function seedEvents() {
	try {
		console.log('Starting to seed monthly schedule events...');
		
		// Optionally clear existing events (uncomment to clear)
		// await pool.query('DELETE FROM calendar_events');
		// console.log('Cleared existing events');
		
		// Generate events starting from today (will start from next Monday)
		const startDate = new Date();
		const events = generateMonthlySchedule(startDate);
		
		console.log(`Generated ${events.length} events for 4-week cycle starting from ${getNextMonday(startDate).toISOString().split('T')[0]}\n`);
		
		// Use transaction for better performance and atomicity
		const client = await pool.connect();
		let insertedCount = 0;
		let skippedCount = 0;
		
		try {
			await client.query('BEGIN');
			
			// Build multi-value INSERT for better performance
			const values = [];
			const params = [];
			let paramIndex = 1;
			
			for (const event of events) {
				values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6})`);
				params.push(
					event.date,
					event.title,
					event.description,
					event.start_time,
					event.end_time,
					event.priority,
					event.all_day
				);
				paramIndex += 7;
			}
			
			const insertQuery = `
				INSERT INTO calendar_events (date, title, description, start_time, end_time, priority, all_day)
				VALUES ${values.join(', ')}
			`;
			
			const result = await client.query(insertQuery, params);
			insertedCount = result.rowCount || events.length;
			
			await client.query('COMMIT');
			
			// Log all inserted events
			events.forEach(event => {
				const timeDisplay = event.all_day ? 'ALL DAY' : `${event.start_time} - ${event.end_time}`;
				const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(event.date).getDay()];
				const allDayMarker = event.all_day ? ' [ALL-DAY]' : '';
				console.log(`✓ ${dayName} ${event.date} | ${timeDisplay.padEnd(20)} | ${event.title}${allDayMarker}`);
			});
			
		} catch (err) {
			await client.query('ROLLBACK');
			console.error('Error inserting events:', err.message);
			throw err;
		} finally {
			client.release();
		}
		
		console.log(`\n✅ Seeding completed!`);
		console.log(`   Inserted: ${insertedCount} events`);
		if (skippedCount > 0) {
			console.log(`   Skipped: ${skippedCount} events (may already exist)`);
		}
		
		// Get total count
		const countResult = await pool.query('SELECT COUNT(*) FROM calendar_events');
		console.log(`📊 Total events in database: ${countResult.rows[0].count}`);
		
		// Show summary by activity
		const summaryResult = await pool.query(`
			SELECT title, COUNT(*) as count 
			FROM calendar_events 
			GROUP BY title 
			ORDER BY count DESC, title
		`);
		console.log(`\n📋 Events by activity:`);
		summaryResult.rows.forEach(row => {
			console.log(`   ${row.title.padEnd(35)} : ${row.count} events`);
		});
		
	} catch (error) {
		console.error('Error seeding events:', error);
		process.exit(1);
	} finally {
		await pool.end();
		process.exit(0);
	}
}

// Run the seeder
seedEvents();

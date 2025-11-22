require('dotenv').config();
const pool = require('../config/database');

/* -----------------------------------------------------------
   Utility Helpers
----------------------------------------------------------- */

function formatDate(date) {
	return date.toISOString().split('T')[0];
}

function getDayOfWeek(date) {
	return date.getDay(); // 0 = Sun
}

function getNextMonday(startDate) {
	const date = new Date(startDate);
	const day = date.getDay();
	const diff = day === 0 ? 1 : (8 - day);
	date.setDate(date.getDate() + diff);
	date.setHours(0, 0, 0, 0);
	return date;
}

function getMondayOfWeek(date) {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday is day 1
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function addDays(date, days) {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

/* -----------------------------------------------------------
   Morning Events
----------------------------------------------------------- */

function addMorningEvents(events, date) {
	const d = formatDate(date);

	// Exercise: 8:30–9:00
	events.push({
		date: d,
		title: 'Exercise',
		description: 'Morning exercise',
		start_time: '08:30:00',
		end_time: '09:00:00',
		priority: 'medium',
		all_day: false
	});

	// Reading: 9:00–10:00
	events.push({
		date: d,
		title: 'Reading',
		description: 'Morning reading',
		start_time: '09:00:00',
		end_time: '10:00:00',
		priority: 'medium',
		all_day: false
	});
}

function addSundayMorning(events, date) {
	const d = formatDate(date);

	events.push({
		date: d,
		title: 'Exercise',
		description: 'Sunday exercise',
		start_time: '08:30:00',
		end_time: '09:30:00',
		priority: 'medium',
		all_day: false
	});

	events.push({
		date: d,
		title: 'Reading',
		description: 'Sunday long reading',
		start_time: '09:30:00',
		end_time: '12:30:00',
		priority: 'medium',
		all_day: false
	});
}

/* -----------------------------------------------------------
   Evening Events
----------------------------------------------------------- */

function addEvening(events, date, title, start = null, end = null) {
	const d = formatDate(date);
	const dow = getDayOfWeek(date);

	// Default evening times
	let startTime = start;
	let endTime = end;

	if (!startTime || !endTime) {
		if (dow === 6) {
			// Saturday
			startTime = '17:30:00';
			endTime = '23:30:00';
		} else {
			// Mon–Fri
			startTime = '20:30:00';
			endTime = '23:30:00';
		}
	}

	events.push({
		date: d,
		title,
		description: title,
		start_time: startTime,
		end_time: endTime,
		priority: 'medium',
		all_day: false
	});
}

/* -----------------------------------------------------------
   Weekly Templates (Clean and EASY to maintain)
----------------------------------------------------------- */

const WEEK_TEMPLATES = {
	1: {
		Mon: 'Drawing / Art',
		Tue: 'Drawing / Art',
		Wed: 'Open Source Contribution',
		Thu: 'Open Source Contribution',
		Fri: 'Magic Stack Project Work',
		Sat: 'Magic Stack Project Work',
		Sun: 'Go Outside / Movie'
	},

	2: {
		Mon: 'Homelab Project',
		Tue: 'Homelab Project',
		Wed: 'Learning Course',
		Thu: 'Learning Course',
		Fri: 'Entertainment – Show/Movie', // FIXED (Go Outside removed from Fri)
		Sat: 'Go Outside / Movie',
		Sun: 'Magic Stack Full Day'
	},

	3: {
		Mon: 'Drawing / Art',
		Tue: 'Drawing / Art',
		Wed: 'Open Source Contribution',
		Thu: 'Open Source Contribution',
		Fri: 'Magic Stack Project Work',
		Sat: 'Magic Stack Project Work',
		Sun: 'Go Outside / Movie'
	},

	4: {
		Mon: 'Homelab Project',
		Tue: 'Homelab Project',
		Wed: 'Learning Course',
		Thu: 'Learning Course',
		Fri: 'Entertainment – Show/Movie',
		Sat: 'Go Outside / Movie',
		Sun: 'Magic Stack Full Day'
	}
};

/* -----------------------------------------------------------
   Weekly Schedule Generator (for one week)
----------------------------------------------------------- */

function generateWeekSchedule(weekStartDate, weekNumber) {
	const events = [];
	const tpl = WEEK_TEMPLATES[weekNumber];
	const base = weekStartDate;

	// Mon–Sat mornings
	for (let i = 0; i < 6; i++) {
		addMorningEvents(events, addDays(base, i));
	}

	// Sunday morning
	addSundayMorning(events, addDays(base, 6));

	// Apply evening schedule
	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	for (let i = 0; i < 7; i++) {
		const dayName = days[i];
		const date = addDays(base, i);
		const activity = tpl[dayName];

		if (!activity) continue;

		// Sunday full-day handling
		if (dayName === 'Sun') {
			if (activity === 'Magic Stack Full Day') {
				events.push({
					date: formatDate(date),
					title: 'Magic Stack Project Work',
					description: 'Full day Magic Stack project work',
					start_time: null,
					end_time: null,
					priority: 'high',
					all_day: true
				});
			} else {
				events.push({
					date: formatDate(date),
					title: activity,
					description: activity,
					start_time: null,
					end_time: null,
					priority: 'medium',
					all_day: true
				});
			}
		} else {
			// Mon–Sat evenings
			addEvening(events, date, activity);
		}
	}

	return events;
}

/* -----------------------------------------------------------
   Full Schedule Generator (from startDate to endDate)
----------------------------------------------------------- */

function generateFullSchedule(startDate, endDate) {
	const events = [];
	const today = new Date(startDate);
	today.setHours(0, 0, 0, 0);
	
	// Get Monday of the current week
	const currentWeekMonday = getMondayOfWeek(today);
	
	// Calculate which week of the 4-week cycle we're in
	// We'll use a reference point: assume week 1 starts on a known Monday
	// For simplicity, we'll calculate based on weeks since a reference date
	const referenceMonday = new Date('2025-01-06'); // A known Monday (week 1)
	const weeksSinceReference = Math.floor((currentWeekMonday - referenceMonday) / (7 * 24 * 60 * 60 * 1000));
	const currentWeekNumber = ((weeksSinceReference % 4) + 4) % 4 + 1; // 1-4
	
	// Calculate end date (December 31, 2026)
	const end = new Date(endDate);
	end.setHours(23, 59, 59, 999);
	
	let currentMonday = new Date(currentWeekMonday);
	let weekNumber = currentWeekNumber;
	
	console.log(`Generating events from ${formatDate(today)} to ${formatDate(end)}...`);
	console.log(`Starting from week ${weekNumber} of the 4-week cycle (Monday: ${formatDate(currentMonday)})`);
	
	// Generate events day by day from today onwards
	let currentDate = new Date(today);
	
	while (currentDate <= end) {
		const dateDayOfWeek = getDayOfWeek(currentDate);
		const weekStartMonday = getMondayOfWeek(currentDate);
		
		// If we've moved to a new week, update week number
		if (weekStartMonday.getTime() !== currentMonday.getTime()) {
			currentMonday = new Date(weekStartMonday);
			weekNumber = (weekNumber % 4) + 1;
		}
		
		const tpl = WEEK_TEMPLATES[weekNumber];
		const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const dayName = days[dateDayOfWeek];
		
		// Add morning events (Mon-Sat)
		if (dateDayOfWeek !== 0) {
			addMorningEvents(events, currentDate);
		} else {
			// Sunday morning
			addSundayMorning(events, currentDate);
		}
		
		// Add evening/full-day events
		const activity = tpl[dayName];
		if (activity) {
			if (dayName === 'Sun') {
				// Sunday full-day handling
				if (activity === 'Magic Stack Full Day') {
					events.push({
						date: formatDate(currentDate),
						title: 'Magic Stack Project Work',
						description: 'Full day Magic Stack project work',
						start_time: null,
						end_time: null,
						priority: 'high',
						all_day: true
					});
				} else {
					events.push({
						date: formatDate(currentDate),
						title: activity,
						description: activity,
						start_time: null,
						end_time: null,
						priority: 'medium',
						all_day: true
					});
				}
			} else {
				// Mon-Sat evenings
				addEvening(events, currentDate, activity);
			}
		}
		
		// Move to next day
		currentDate = addDays(currentDate, 1);
		
		// Progress indicator every 30 days
		if (events.length > 0 && events.length % (30 * 3) === 0) {
			console.log(`  Generated ${events.length} events so far... (current date: ${formatDate(currentDate)})`);
		}
	}
	
	// Post-process: Ensure ALL events on Sunday are set to all_day: true
	// EXCEPT Reading and Exercise which should remain time-bound
	// Also ensure Saturday events are NEVER all_day (they are 5:30-11:30 PM only)
	events.forEach(event => {
		const eventDate = new Date(event.date + 'T00:00:00');
		const dayOfWeek = getDayOfWeek(eventDate);
		
		// Saturday (day 6) - ensure evening events are NOT all_day
		if (dayOfWeek === 6) { // Saturday
			// Saturday evening events should be time-bound (5:30-11:30 PM)
			// Only Reading and Exercise can be time-bound, all evening activities should have times
			if (event.title !== 'Reading' && event.title !== 'Exercise') {
				// Ensure Saturday evening events are NOT all_day
				event.all_day = false;
				// If somehow times are missing, set default Saturday times
				if (!event.start_time || !event.end_time) {
					event.start_time = '17:30:00';
					event.end_time = '23:30:00';
				}
			}
		}
		
		// Sunday (day 0) - set to all_day except Reading and Exercise
		if (dayOfWeek === 0) { // Sunday
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

/* -----------------------------------------------------------
   Seeder
----------------------------------------------------------- */

async function seedEvents() {
	try {
		console.log('Starting to seed events from today to end of 2026...\n');

		const startDate = new Date();
		const endDate = new Date('2026-12-31');
		
		// Generate all events from today to end of 2026
		const events = generateFullSchedule(startDate, endDate);

		console.log(`\nGenerated ${events.length} events total.`);
		console.log('Inserting into database...\n');

		const client = await pool.connect();
		
		try {
			await client.query('BEGIN');

			// Insert in batches to avoid parameter limits (PostgreSQL has a limit of ~65535 parameters)
			const batchSize = 1000; // ~7000 parameters per batch (1000 events * 7 params)
			let totalInserted = 0;

			for (let i = 0; i < events.length; i += batchSize) {
				const batch = events.slice(i, i + batchSize);
				const values = [];
				const params = [];
				let idx = 1;

				for (const e of batch) {
					values.push(
						`($${idx},$${idx + 1},$${idx + 2},$${idx + 3},$${idx + 4},$${idx + 5},$${idx + 6})`
					);
					params.push(
						e.date,
						e.title,
						e.description,
						e.start_time,
						e.end_time,
						e.priority,
						e.all_day
					);
					idx += 7;
				}

				await client.query(
					`INSERT INTO calendar_events 
					(date, title, description, start_time, end_time, priority, all_day)
					VALUES ${values.join(', ')}`,
					params
				);

				totalInserted += batch.length;
				console.log(`  Inserted batch: ${totalInserted} / ${events.length} events`);
			}

			await client.query('COMMIT');
			console.log(`\n✅ Successfully inserted ${totalInserted} events!`);

			// Get summary statistics
			const countResult = await client.query('SELECT COUNT(*) FROM calendar_events');
			console.log(`📊 Total events in database: ${countResult.rows[0].count}`);

			const dateRangeResult = await client.query(`
				SELECT MIN(date) as first_date, MAX(date) as last_date 
				FROM calendar_events
			`);
			if (dateRangeResult.rows[0].first_date) {
				console.log(`📅 Date range: ${dateRangeResult.rows[0].first_date} to ${dateRangeResult.rows[0].last_date}`);
			}

		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		} finally {
			client.release();
		}

	} catch (err) {
		console.error('Error while seeding:', err);
		process.exit(1);
	} finally {
		await pool.end();
		process.exit(0);
	}
}

seedEvents();

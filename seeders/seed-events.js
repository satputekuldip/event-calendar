require('dotenv').config();
const pool = require('../config/database');

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SUNDAY = 0;
const SATURDAY = 6;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const MILLISECONDS_PER_WEEK = 7 * MILLISECONDS_PER_DAY;

function formatDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function getDayOfWeek(date) {
	return date.getDay();
}

function getMondayOfWeek(date) {
	const dateCopy = new Date(date);
	const day = dateCopy.getDay();
	const diff = dateCopy.getDate() - day + (day === 0 ? -6 : 1);
	dateCopy.setDate(diff);
	dateCopy.setHours(0, 0, 0, 0);
	return dateCopy;
}

function addDays(date, days) {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

function addMorningEvents(events, date) {
	const formattedDate = formatDate(date);

	events.push({
		date: formattedDate,
		title: 'Exercise',
		description: 'Morning exercise',
		start_time: '08:30:00',
		end_time: '09:00:00',
		priority: 'medium',
		all_day: false
	});

	events.push({
		date: formattedDate,
		title: 'Reading',
		description: 'Morning reading',
		start_time: '09:00:00',
		end_time: '10:00:00',
		priority: 'medium',
		all_day: false
	});
}

function addSundayMorning(events, date) {
	const formattedDate = formatDate(date);

	events.push({
		date: formattedDate,
		title: 'Exercise',
		description: 'Sunday exercise',
		start_time: '08:30:00',
		end_time: '09:30:00',
		priority: 'medium',
		all_day: false
	});

	events.push({
		date: formattedDate,
		title: 'Reading',
		description: 'Sunday long reading',
		start_time: '09:30:00',
		end_time: '12:30:00',
		priority: 'medium',
		all_day: false
	});
}

function addEveningEvent(events, date, title, startTime = null, endTime = null) {
	const formattedDate = formatDate(date);
	const dayOfWeek = getDayOfWeek(date);

	if (!startTime || !endTime) {
		if (dayOfWeek === SATURDAY) {
			startTime = '17:30:00';
			endTime = '23:30:00';
		} else {
			startTime = '20:30:00';
			endTime = '23:30:00';
		}
	}

	events.push({
		date: formattedDate,
		title,
		description: title,
		start_time: startTime,
		end_time: endTime,
		priority: 'medium',
		all_day: false
	});
}

function addFullDayEvent(events, date, title, priority = 'medium') {
	events.push({
		date: formatDate(date),
		title,
		description: title,
		start_time: null,
		end_time: null,
		priority,
		all_day: true
	});
}

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
		Fri: 'Entertainment – Show/Movie',
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

function calculateWeekNumber(referenceMonday, currentMonday) {
	const weeksSinceReference = Math.floor((currentMonday - referenceMonday) / MILLISECONDS_PER_WEEK);
	return ((weeksSinceReference % 4) + 4) % 4 + 1;
}

function generateFullSchedule(startDate, endDate) {
	const events = [];
	const start = new Date(startDate);
	start.setHours(0, 0, 0, 0);
	
	const end = new Date(endDate);
	end.setHours(23, 59, 59, 999);
	
	const currentWeekMonday = getMondayOfWeek(start);
	const referenceMonday = new Date(2025, 0, 6); // January 6, 2025 (month is 0-indexed)
	referenceMonday.setHours(0, 0, 0, 0);
	let currentMonday = new Date(currentWeekMonday);
	let weekNumber = calculateWeekNumber(referenceMonday, currentWeekMonday);
	
	console.log(`Generating events from ${formatDate(start)} to ${formatDate(end)}...`);
	console.log(`Starting from week ${weekNumber} of the 4-week cycle (Monday: ${formatDate(currentMonday)})`);
	
	let currentDate = new Date(start);
	
	while (currentDate <= end) {
		currentDate.setHours(0, 0, 0, 0);
		const dayOfWeek = getDayOfWeek(currentDate);
		const weekStartMonday = getMondayOfWeek(currentDate);
		
		if (weekStartMonday.getTime() !== currentMonday.getTime()) {
			currentMonday = new Date(weekStartMonday);
			weekNumber = (weekNumber % 4) + 1;
		}
		
		const template = WEEK_TEMPLATES[weekNumber];
		const dayName = DAYS_OF_WEEK[dayOfWeek];
		
		if (dayOfWeek !== SUNDAY) {
			addMorningEvents(events, currentDate);
		} else {
			addSundayMorning(events, currentDate);
		}
		
		const activity = template[dayName];
		if (activity) {
			if (dayName === 'Sun') {
				if (activity === 'Magic Stack Full Day') {
					addFullDayEvent(events, currentDate, 'Magic Stack Project Work', 'high');
				} else {
					addFullDayEvent(events, currentDate, activity);
				}
			} else {
				addEveningEvent(events, currentDate, activity);
			}
		}
		
		currentDate = addDays(currentDate, 1);
		
		if (events.length > 0 && events.length % 90 === 0) {
			console.log(`  Generated ${events.length} events so far... (current date: ${formatDate(currentDate)})`);
		}
	}
	
	return events;
}

async function seedEvents() {
	try {
		console.log('Starting to seed events from today to end of 2026...\n');

		const startDate = new Date();
		const endDate = new Date(2026, 11, 31); // December 31, 2026 (month is 0-indexed)
		const events = generateFullSchedule(startDate, endDate);

		console.log(`\nGenerated ${events.length} events total.`);
		console.log('Inserting into database...\n');

		const client = await pool.connect();
		
		try {
			await client.query('BEGIN');

			const batchSize = 1000;
			let totalInserted = 0;

			for (let i = 0; i < events.length; i += batchSize) {
				const batch = events.slice(i, i + batchSize);
				const values = [];
				const params = [];
				let paramIndex = 1;

				for (const event of batch) {
					values.push(
						`($${paramIndex},$${paramIndex + 1},$${paramIndex + 2},$${paramIndex + 3},$${paramIndex + 4},$${paramIndex + 5},$${paramIndex + 6})`
					);
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

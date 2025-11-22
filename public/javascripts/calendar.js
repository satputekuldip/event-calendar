// --- CONFIG ---
var API_URL = "/api/events"; // Events API endpoint

// --- UTILS ---

// Clock Logic
var CLOCK_DAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];
var CLOCK_MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

function updateClock() {
	var now = new Date();
	var hours24 = now.getHours();
	var minutesVal = now.getMinutes();
	var ampm = hours24 >= 12 ? "PM" : "AM";
	var hours12 = hours24 % 12;
	hours12 = hours12 ? hours12 : 12;
	var hoursStr =
		hours12 < 10 ? "0" + hours12 : "" + hours12;
	var minutesStr =
		minutesVal < 10 ? "0" + minutesVal : "" + minutesVal;

	var dateString =
		CLOCK_DAYS[now.getDay()] +
		", " +
		CLOCK_MONTHS[now.getMonth()] +
		" " +
		now.getDate();

	// Update individual elements (avoid innerHTML and heavy recalcs)
	var hEl = document.getElementById("clock-hours");
	var mEl = document.getElementById("clock-minutes");
	var ampmEl = document.getElementById("clock-ampm");
	if (hEl) hEl.textContent = hoursStr;
	if (mEl) mEl.textContent = minutesStr;
	if (ampmEl) ampmEl.textContent = ampm;
	var dEl = document.getElementById("date-display");
	if (dEl) dEl.textContent = dateString;
}
setInterval(updateClock, 1000);
updateClock();

// Calendar Render Logic
function generateCalendar() {
	var now = new Date();
	var currentMonth = now.getMonth();
	var currentYear = now.getFullYear();
	var today = now.getDate();

	var months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	document.getElementById("calendar-header").textContent =
		months[currentMonth] + " " + currentYear;

	var firstDay = new Date(currentYear, currentMonth, 1).getDay();
	var daysInMonth = new Date(
		currentYear,
		currentMonth + 1,
		0
	).getDate();

	var tbl = document.getElementById("calendar-body");
	tbl.innerHTML = "";

	var date = 1;
	for (var i = 0; i < 6; i++) {
		var row = document.createElement("tr");
		for (var j = 0; j < 7; j++) {
			var cell = document.createElement("td");
			if (i === 0 && j < firstDay) {
				cell.appendChild(document.createTextNode(""));
			} else if (date > daysInMonth) {
				break;
			} else {
				if (date === today) {
					var span = document.createElement("span");
					span.className = "today-cell";
					span.innerText = date;
					cell.appendChild(span);
				} else {
					cell.innerText = date;
				}
				date++;
			}
			row.appendChild(cell);
		}
		tbl.appendChild(row);
	}
}
generateCalendar();

// --- EVENTS API & TIMELINE LOGIC ---

function fetchEvents() {
	// Generate date string for today (YYYY-MM-DD)
	var today = new Date();
	var y = today.getFullYear();
	var m = today.getMonth() + 1; // 1-12
	var d = today.getDate();
	var dateStr =
		y +
		"-" +
		(m < 10 ? "0" + m : m) +
		"-" +
		(d < 10 ? "0" + d : d);

	document.getElementById("event-subtitle").textContent =
		"Syncing with Events API...";

	var url = API_URL + "/" + dateStr;

	// Use XMLHttpRequest for better compatibility with older iPad Minis
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.setRequestHeader("Content-Type", "application/json");

	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				try {
					var data = JSON.parse(xhr.responseText);
					// Normalize data types (PostgreSQL might return strings)
					if (data && Array.isArray(data)) {
						data = data.map(function (event) {
							// Convert all_day to boolean if it's a string
							if (
								typeof event.all_day === "string"
							) {
								event.all_day =
									event.all_day === "true" ||
									event.all_day === "t" ||
									event.all_day === "1";
							}
							// Ensure time fields are strings
							if (event.start_time && typeof event.start_time !== "string") {
								event.start_time = String(event.start_time);
							}
							if (event.end_time && typeof event.end_time !== "string") {
								event.end_time = String(event.end_time);
							}
							return event;
						});
					}
					renderTimeline(data);
					document.getElementById("event-subtitle").textContent =
						"Up to date";
				} catch (e) {
					console.error("Error parsing response:", e);
					document.getElementById("event-subtitle").textContent =
						"Error parsing data";
					renderTimeline([]);
				}
			} else {
				console.error(
					"API Error:",
					xhr.status,
					xhr.statusText
				);
				document.getElementById("event-subtitle").textContent =
					"Error loading events (" + xhr.status + ")";
				renderTimeline([]);
			}
		}
	};

	xhr.onerror = function () {
		console.error("Network error fetching events");
		document.getElementById("event-subtitle").textContent =
			"Network error";
		renderTimeline([]);
	};

	xhr.send();
}

function renderTimeline(events) {
	var container = document.getElementById("timeline-content");
	container.innerHTML = "";

	if (!events || events.length === 0) {
		container.innerHTML =
			'<div class="no-events">No events scheduled.</div>';
		return;
	}

	// Sort by start_time
	events.sort(function (a, b) {
		if (a.all_day) return -1; // All day first
		if (b.all_day) return 1;
		return a.start_time.localeCompare(b.start_time);
	});

	for (var i = 0; i < events.length; i++) {
		var e = events[i];

		var item = document.createElement("div");
		// Add priority class
		item.className =
			"timeline-item priority-" + (e.priority || "medium");

		// Time display
		var timeHTML = "";
		if (e.all_day) {
			timeHTML = "ALL DAY";
		} else {
			// convert 24h string "14:00" to 12h "2:00 PM"
			timeHTML = formatTimeStr(e.start_time);
		}

		// Duration text
		var durationHTML = "";
		if (!e.all_day && e.start_time && e.end_time) {
			durationHTML =
				formatTimeStr(e.start_time) +
				" - " +
				formatTimeStr(e.end_time);
		}

		// Badge
		var badgeHTML = "";
		if (e.all_day) {
			badgeHTML = '<div class="all-day-badge">All Day</div>';
		}

		item.innerHTML =
			'<div class="timeline-time">' +
			timeHTML +
			"</div>" +
			'<div class="timeline-dot"></div>' +
			'<div class="timeline-card">' +
			badgeHTML +
			'<div class="timeline-title">' +
			e.title +
			"</div>" +
			'<div class="timeline-desc">' +
			e.description +
			"</div>" +
			'<div class="timeline-duration">' +
			durationHTML +
			"</div>" +
			"</div>";

		container.appendChild(item);
	}
}

function formatTimeStr(timeStr) {
	// Input "14:30", Output "2:30 PM"
	if (!timeStr) return "";
	var parts = timeStr.split(":");
	var h = parseInt(parts[0], 10);
	var m = parts[1];
	var ampm = h >= 12 ? "PM" : "AM";
	h = h % 12;
	h = h ? h : 12;
	return h + ":" + m + " " + ampm;
}

// Initialize
fetchEvents();
// Refresh events every minute
setInterval(fetchEvents, 60000);


# Event Calendar

A modern, dark-themed calendar application designed for iPad Mini, featuring a real-time clock, monthly calendar view, and event timeline with PostgreSQL integration.

![Event Calendar Preview](public/images/Screenshot%202025-11-23%20at%201.36.28%20AM.png)

## Features

- **Real-time Clock**: Large, bold digital clock with 12-hour format and leading zeros
- **Monthly Calendar View**: Interactive calendar grid highlighting the current date
- **Event Timeline**: Vertical timeline displaying events with priority-based color coding
- **PostgreSQL Integration**: Robust database backend for event storage
- **Auto-refresh**: Events automatically refresh every minute
- **iPad Mini Optimized**: Designed specifically for iPad Mini with responsive layout
- **Dark Theme**: Modern dark mode interface with high contrast

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Frontend**: EJS templates, vanilla JavaScript, CSS3
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions for automated Docker image builds

## Prerequisites

- Node.js 18+ (or Docker)
- PostgreSQL 15+ (or use Docker Compose)
- npm or yarn

## Installation

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd event-calendar
```

2. Create a `.env` file:
```env
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=event_calendar
DB_USERNAME=postgres
DB_PASSWORD=postgres
APP_PORT=3000
NODE_ENV=production
```

3. Start the application:
```bash
docker-compose up -d
```

The application will be available at `http://localhost:3000`

### Manual Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd event-calendar
```

2. Install dependencies:
```bash
npm install
```

3. Set up PostgreSQL database:
```sql
CREATE DATABASE event_calendar;

CREATE TABLE calendar_events (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIME,
    end_time TIME,
    priority VARCHAR(20) DEFAULT 'medium',
    all_day BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

4. Create a `.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=event_calendar
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

5. Start the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Project Structure

```
event-calendar/
├── bin/
│   └── www                 # Application entry point
├── config/
│   └── database.js         # PostgreSQL connection pool
├── public/
│   ├── images/            # Static images
│   ├── javascripts/
│   │   └── calendar.js     # Frontend JavaScript
│   └── stylesheets/
│       └── calendar.css    # Application styles
├── routes/
│   ├── index.js            # Home route
│   └── events.js           # Events API routes
├── views/
│   ├── index.ejs           # Main calendar view
│   └── error.ejs           # Error page
├── app.js                  # Express application setup
├── Dockerfile              # Production Docker image
├── docker-compose.yml      # Production Docker Compose
└── docker-compose.dev.yml # Development Docker Compose
```

## API Endpoints

### GET `/api/events/:date`

Retrieve events for a specific date.

**Parameters:**
- `date` (string, required): Date in YYYY-MM-DD format

**Example:**
```bash
GET /api/events/2025-11-23
```

**Response:**
```json
[
  {
    "date": "2025-11-23",
    "title": "Drawing / Art Time",
    "description": "test",
    "start_time": "20:30:00",
    "end_time": "23:30:00",
    "priority": "medium",
    "all_day": false
  }
]
```

## Database Schema

### calendar_events Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `date` | DATE | Event date (YYYY-MM-DD) |
| `title` | VARCHAR(255) | Event title |
| `description` | TEXT | Event description |
| `start_time` | TIME | Start time (HH:MM:SS) |
| `end_time` | TIME | End time (HH:MM:SS) |
| `priority` | VARCHAR(20) | Priority: 'low', 'medium', 'high' |
| `all_day` | BOOLEAN | Whether event is all-day |
| `created_at` | TIMESTAMP | Creation timestamp |

## Docker Deployment

### Building Docker Image

```bash
docker build -t event-calendar .
```

### Running with Docker Compose

**Production:**
```bash
docker-compose up -d
```

**Development:**
```bash
docker-compose -f docker-compose.dev.yml up
```

### GitHub Container Registry

The project includes GitHub Actions workflow that automatically builds and pushes Docker images to GitHub Container Registry (GHCR) when version tags are pushed:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Images are available at: `ghcr.io/<username>/event-calendar:v1.0.0`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_DATABASE` | Database name | `event_calendar` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `APP_PORT` | Application port | `3000` |
| `NODE_ENV` | Environment | `production` |

## Features in Detail

### Clock Display
- Updates every second
- 12-hour format with AM/PM
- Leading zeros for single-digit hours
- Large, bold font for wall readability

### Calendar View
- Current month display
- Today's date highlighted in red circle
- Responsive grid layout

### Event Timeline
- Color-coded by priority:
  - **Red**: High priority
  - **Orange**: Medium priority
  - **Green**: Low priority
- All-day events displayed at the top
- Time range display for timed events
- Auto-refresh every 60 seconds

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` for automatic server restarts on file changes.

### Code Structure

- **Frontend**: Vanilla JavaScript (no frameworks) for maximum compatibility with older iPad Minis
- **Styling**: CSS3 with webkit prefixes for iOS compatibility
- **Backend**: Express.js with EJS templating
- **Database**: PostgreSQL with connection pooling

## Browser Compatibility

- Safari (iOS 9+)
- Chrome (latest)
- Firefox (latest)
- Optimized for iPad Mini

## License

Private project

## Contributing

This is a private project. For issues or suggestions, please contact the maintainer.


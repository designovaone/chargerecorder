# Car Charge Recorder - Specification

A minimal web app for tracking electric car charge levels via voice or text input.
Deployed as a standalone service at chargerecorder.coffeit.com.

## Core Requirements

### Access & Security
- Single passphrase unlock (stored as env var: `UNLOCK_PHRASE`)
- Session persists via httpOnly cookie (24h expiry)
- No user accounts - single-user app

### Input Methods
- Voice input via Web Speech API (Chrome/Safari)
- Text input fallback
- Parse: "62 percent", "62%", or just "62"
- Show clear feedback: "Recorded 62% as start charge"

### Data Model
One entity: **ChargingSession**
- id (auto)
- start_percentage (int, 0-100)
- start_time (date yyyy-mm-dd && time hh:mm)  
- end_percentage (int, nullable)
- end_time (datetime, nullable)

### User Actions
- **Record start**: Creates new session with start_%/time
- **Record end**: Updates most recent open session with end_%/time
- **View history**: List of all sessions (newest first)
- **Export CSV**: Download all sessions

### CSV Export Format
```
start_percentage,start_datetime,end_percentage,end_datetime
```

## User Flow

1. Navigate to chargerecorder.coffeit.com
2. Enter passphrase → redirected to main view
3. See current status: "No active charge" or "Charging: started at 62%"
4. Tap mic → say "75 percent" → see confirmation
5. View session history below
6. Tap "Export CSV" to download

## Technical Stack

### Backend
- Python 3.11+ / FastAPI
- SQLite database (single file: `data/charges.db`)
- Simple structure: main.py + models.py + routes.py
- CORS configured for production domain

### Frontend
- Single HTML page served by FastAPI
- Vanilla JavaScript (no build step, no npm)
- Tailwind CSS via CDN
- Mobile-first, optimized for iPhone Safari

### Project Structure
```
chargerecorder/
├── CLAUDE.md
├── main.py              # FastAPI app entry point
├── models.py            # SQLAlchemy models
├── routes.py            # API endpoints
├── requirements.txt     # Python dependencies
├── static/
│   └── index.html       # Single-page frontend
├── data/
│   └── charges.db       # SQLite database (auto-created)
└── .env.example         # Environment template
```

### Deployment
- Runs on port 8080 (configurable via `PORT` env var)
- Health check endpoint: `GET /health`
- Environment variables:
  - `UNLOCK_PHRASE` - required
  - `PORT` - default 8080

## API Endpoints

```
POST /api/unlock        {phrase: "xxx"} → sets session cookie
GET  /api/status        → current session state
GET  /api/sessions      → list all sessions
POST /api/sessions      {percentage: 62, type: "start"|"end"}
GET  /api/sessions/csv  → download CSV file
GET  /health            → {"status": "ok"}
```

## UI Requirements

### Layout (mobile-first)
- Full viewport height, no scrolling on main view
- Large touch targets (min 44px)
- High contrast text

### Components
1. **Status banner**: Shows "No active charge" or "Charging since HH:MM (XX%)"
2. **Input area**: Microphone button (large), text field, submit button
3. **History list**: Scrollable, shows last 10 sessions
4. **Export button**: Fixed at bottom

### Voice Input
- Use Web Speech API (SpeechRecognition)
- Show listening state visually
- Parse result for number + optional "percent"
- Fallback message if speech not supported

## Out of Scope
- User accounts / multi-user
- Analytics / charts
- Push notifications
- Offline/PWA support
- Multiple vehicles
- Build tools (webpack, vite, npm)

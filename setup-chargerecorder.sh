#!/bin/bash
#
# Setup script for Car Charge Recorder (Clean Build)
# Creates project folder, spec file, and Python environment
#

set -e

# Configuration
# Using existing directory - run in-place
PROJECT_DIR="$(pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Car Charge Recorder - Build Setup ===${NC}"
echo ""

# Step 1: Use existing project folder
echo -e "${YELLOW}Step 1: Using existing project folder...${NC}"
cd "$PROJECT_DIR"
echo "Working in: $PROJECT_DIR"

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    git init --quiet
    echo "Initialized git repository"
else
    echo "Git repository already exists"
fi

# Step 2: Create CLAUDE.md spec file
echo ""
echo -e "${YELLOW}Step 2: Creating CLAUDE.md specification...${NC}"

cat > CLAUDE.md << 'SPEC_EOF'
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
SPEC_EOF

echo "Created: CLAUDE.md"

# Step 3: Create Python virtual environment
echo ""
echo -e "${YELLOW}Step 3: Creating Python virtual environment...${NC}"

python3 -m venv venv
echo "Created: venv/"

# Create activation helper
cat > activate.sh << 'ACTIVATE_EOF'
#!/bin/bash
source venv/bin/activate
echo "Virtual environment activated"
ACTIVATE_EOF
chmod +x activate.sh

# Step 4: Create placeholder directories
echo ""
echo -e "${YELLOW}Step 4: Creating directory structure...${NC}"
mkdir -p static data
touch static/.gitkeep data/.gitkeep

# Create .gitignore
cat > .gitignore << 'GITIGNORE_EOF'
venv/
__pycache__/
*.pyc
.env
data/*.db
.DS_Store
GITIGNORE_EOF

echo "Created: static/, data/, .gitignore"

# Create the build prompt file for easy reference
cat > BUILD_PROMPT.md << 'PROMPT_EOF'
# Build Prompt for Claude Code

Copy and paste this into Claude Code after running `claude` in this directory:

---

Build the charge recorder app according to the CLAUDE.md specification.

Create the complete implementation:
1. First create requirements.txt with FastAPI, SQLAlchemy, uvicorn, python-dotenv
2. Create models.py with the ChargingSession SQLAlchemy model
3. Create routes.py with all API endpoints
4. Create main.py that ties everything together
5. Create static/index.html with the complete frontend
6. Create .env.example

Keep it minimal - no extra features beyond the spec.
PROMPT_EOF

echo "Created: BUILD_PROMPT.md"

# Summary
echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Project created at: $PROJECT_DIR"
echo ""
echo "Files created:"
echo "  - CLAUDE.md        (specification)"
echo "  - BUILD_PROMPT.md  (prompt to use with Claude)"
echo "  - venv/            (Python virtual environment)"
echo "  - static/          (frontend files go here)"
echo "  - data/            (SQLite database goes here)"
echo "  - .gitignore"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "  1. cd $PROJECT_DIR"
echo "  2. source venv/bin/activate"
echo "  3. claude"
echo "  4. Paste the prompt from BUILD_PROMPT.md"
echo ""
echo "Or run this one-liner:"
echo ""
echo -e "  ${GREEN}cd $PROJECT_DIR && source venv/bin/activate && claude${NC}"
echo ""

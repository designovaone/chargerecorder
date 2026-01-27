# Plan: Migrate Charge Recorder to Vercel + Neon PostgreSQL

## Overview

Migrate from FastAPI/SQLite to Vercel API Routes + Neon PostgreSQL while keeping all existing functionality including voice input (client-side, no changes).

**Voice-to-text:** Stays in browser (Safari Web Speech API) - ZERO changes needed

---

## Current Architecture

```
FastAPI (main.py)
├── routes.py          # All API endpoints
├── models.py          # SQLAlchemy + SQLite
└── static/index.html  # Frontend + voice JS
```

**Database:** SQLite (`data/charges.db`)

---

## Target Architecture (Vercel + Neon)

```
Vercel Project
├── api/
│   ├── unlock.py           # POST /api/unlock
│   ├── status.py           # GET /api/status
│   ├── sessions.py         # GET/POST /api/sessions
│   ├── sessions/
│   │   └── [id].py         # DELETE /api/sessions/{id}
│   └── sessions/
│       └── csv.py          # GET /api/sessions/csv
├── public/
│   └── index.html          # Frontend + voice JS
├── vercel.json             # Vercel config
└── requirements.txt        # Python dependencies
```

**Database:** Neon PostgreSQL

---

## Step-by-Step Implementation

### Phase 1: Set up Neon Database

1. **Create Neon project:**
   - Log in to Neon Console
   - Create new project: `chargerecorder`
   - Get connection string (save for `.env`)

2. **Create table in Neon:**
   ```sql
   CREATE TABLE charging_sessions (
       id SERIAL PRIMARY KEY,
       start_percentage INTEGER NOT NULL CHECK (start_percentage >= 0 AND start_percentage <= 100),
       start_time TIMESTAMP NOT NULL DEFAULT NOW(),
       end_percentage INTEGER CHECK (end_percentage >= 0 AND end_percentage <= 100),
       end_time TIMESTAMP
   );

   CREATE INDEX idx_start_time ON charging_sessions(start_time DESC);
   ```

3. **Save credentials:**
   - `NEON_DATABASE_URL` (from Neon console)

---

### Phase 2: Create Vercel Project Structure

Create new files (don't modify existing ones yet):

#### `api/unlock.py`
```python
from Vercel import Request, Response
import os
from database import get_db_connection

UNLOCK_PHRASE = os.getenv("UNLOCK_PHRASE")
SESSION_COOKIE_NAME = "chargerecorder_session"

async def handler(request: Request) -> Response:
    if request.method != "POST":
        return Response.json({"error": "Method not allowed"}, status=405)

    body = await request.json()
    phrase = body.get("phrase")

    if not UNLOCK_PHRASE or phrase == UNLOCK_PHRASE:
        response = Response.json({"success": True, "message": "Unlocked"})
        response.set_cookie(
            SESSION_COOKIE_NAME,
            UNLOCK_PHRASE or "unlocked",
            httponly=True,
            max_age=86400,
            samesite="lax"
        )
        return response

    return Response.json({"success": False, "message": "Incorrect passphrase"}, status=401)
```

#### `api/status.py`
```python
from Vercel import Request, Response
from database import get_db_connection
from auth import require_auth

@require_auth
async def handler(request: Request) -> Response:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT start_percentage, start_time
        FROM charging_sessions
        WHERE end_percentage IS NULL
        ORDER BY start_time DESC
        LIMIT 1
    """)

    row = cursor.fetchone()
    conn.close()

    if row:
        return Response.json({
            "status": "charging",
            "start_percentage": row[0],
            "start_time": row[1].isoformat()
        })

    return Response.json({"status": "idle"})
```

#### `api/sessions.py`
```python
from Vercel import Request, Response
from database import get_db_connection
from auth import require_auth
import json

@require_auth
async def handler(request: Request) -> Response:
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "GET":
        cursor.execute("""
            SELECT id, start_percentage, start_time, end_percentage, end_time
            FROM charging_sessions
            ORDER BY start_time DESC
        """)

        sessions = [{
            "id": row[0],
            "start_percentage": row[1],
            "start_time": row[2].isoformat(),
            "end_percentage": row[3],
            "end_time": row[4].isoformat() if row[4] else None
        } for row in cursor.fetchall()]

        conn.close()
        return Response.json({"sessions": sessions})

    elif request.method == "POST":
        body = await request.json()
        percentage = body.get("percentage")
        session_type = body.get("type")

        if not percentage or percentage < 0 or percentage > 100:
            conn.close()
            return Response.json({"detail": "Invalid percentage"}, status=400)

        from datetime import datetime
        now = datetime.now()

        if session_type == "start":
            cursor.execute("""
                INSERT INTO charging_sessions (start_percentage, start_time)
                VALUES (%s, %s)
                RETURNING id, start_percentage, start_time
            """, (percentage, now))

            row = cursor.fetchone()
            conn.commit()
            conn.close()

            return Response.json({
                "message": f"Recorded {percentage}% as start charge",
                "session": {
                    "id": row[0],
                    "start_percentage": row[1],
                    "start_time": row[2].isoformat()
                }
            })

        elif session_type == "end":
            cursor.execute("""
                SELECT id FROM charging_sessions
                WHERE end_percentage IS NULL
                ORDER BY start_time DESC
                LIMIT 1
                FOR UPDATE
            """)
            row = cursor.fetchone()

            if not row:
                conn.close()
                return Response.json({"detail": "No active charging session"}, status=400)

            cursor.execute("""
                UPDATE charging_sessions
                SET end_percentage = %s, end_time = %s
                WHERE id = %s
                RETURNING id, start_percentage, start_time, end_percentage, end_time
            """, (percentage, now, row[0]))

            updated = cursor.fetchone()
            conn.commit()
            conn.close()

            return Response.json({
                "message": f"Recorded {percentage}% as end charge",
                "session": {
                    "id": updated[0],
                    "start_percentage": updated[1],
                    "start_time": updated[2].isoformat(),
                    "end_percentage": updated[3],
                    "end_time": updated[4].isoformat()
                }
            })

    conn.close()
    return Response.json({"detail": "Invalid request"}, status=400)
```

#### `api/sessions/[id].py`
```python
from Vercel import Request, Response
from database import get_db_connection
from auth import require_auth

@require_auth
async def handler(request: Request) -> Response:
    if request.method != "DELETE":
        return Response.json({"error": "Method not allowed"}, status=405)

    session_id = int(request.path_params["id"])
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM charging_sessions WHERE id = %s RETURNING id", (session_id,))
    row = cursor.fetchone()

    conn.commit()
    conn.close()

    if not row:
        return Response.json({"detail": "Session not found"}, status=404)

    return Response.json({"message": "Session deleted"})
```

#### `api/sessions/csv.py`
```python
from Vercel import Request, Response
from database import get_db_connection
from auth import require_auth
import csv
from io import StringIO

@require_auth
async def handler(request: Request) -> Response:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT start_percentage, start_time, end_percentage, end_time
        FROM charging_sessions
        ORDER BY start_time ASC
    """)

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["start_percentage", "start_datetime", "end_percentage", "end_datetime"])

    for row in cursor.fetchall():
        writer.writerow([
            row[0],
            row[1].isoformat(),
            row[2] if row[2] else "",
            row[3].isoformat() if row[3] else ""
        ])

    conn.close()

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        headers={
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=charging_sessions.csv"
        }
    )
```

#### `api/health.py`
```python
from Vercel import Response

async def handler(request: Request) -> Response:
    return Response.json({"status": "ok"})
```

---

### Phase 3: Shared Modules

#### `database.py` (project root)
```python
import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.getenv("NEON_DATABASE_URL")

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
```

#### `auth.py` (project root)
```python
import os
from Vercel import Request
from Vercel import Response

UNLOCK_PHRASE = os.getenv("UNLOCK_PHRASE")
SESSION_COOKIE_NAME = "chargerecorder_session"

def require_auth(handler):
    async def wrapper(request: Request) -> Response:
        session_cookie = request.cookies.get(SESSION_COOKIE_NAME)

        if not UNLOCK_PHRASE:
            return await handler(request)

        if not session_cookie or session_cookie != UNLOCK_PHRASE:
            return Response.json({"detail": "Unauthorized"}, status=401)

        return await handler(request)

    return wrapper
```

---

### Phase 4: Frontend

#### `public/index.html` (move from `static/`)

**Changes needed:**
1. Update `API_BASE` if needed (should work with relative paths)
2. All voice input code stays **exactly the same**

---

### Phase 5: Configuration

#### `vercel.json`
```json
{
  "buildCommand": "echo 'No build needed'",
  "outputDirectory": "public",
  "functions": {
    "api/**/*.py": {
      "runtime": "python3.9"
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "NEON_DATABASE_URL": "@neon_db_url",
    "UNLOCK_PHRASE": "@unlock_phrase"
  }
}
```

#### `requirements.txt`
```
psycopg2-binary>=2.9.0
Vercel>=0.0.1
```

---

### Phase 6: Environment Variables (Vercel Dashboard)

Set in Vercel Project Settings → Environment Variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEON_DATABASE_URL` | `postgresql://...` | All |
| `UNLOCK_PHRASE` | `your-secret-phrase` | All |

---

### Phase 7: Deployment Steps

1. **Push code to GitHub**
2. **Connect repository to Vercel**
3. **Set environment variables in Vercel dashboard**
4. **Deploy**
5. **Test at:** `https://chargerecorder.coffeit.com`

---

## Verification Checklist

- [ ] Neon database created with correct schema
- [ ] All API endpoints deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Frontend loads at `https://chargerecorder.coffeit.com`
- [ ] Unlock works with passphrase
- [ ] Can record start charge via text
- [ ] Can record stop charge via text
- [ ] Voice input works on macOS Safari
- [ ] Voice input works on iPhone Safari (HTTPS!)
- [ ] History displays correctly
- [ ] Delete single session works
- [ ] Clear all sessions works
- [ ] CSV export works

---

## Files to Create/Modify

### New Files
- `api/unlock.py`
- `api/status.py`
- `api/sessions.py`
- `api/sessions/[id].py`
- `api/sessions/csv.py`
- `api/health.py`
- `database.py`
- `auth.py`
- `vercel.json`

### Move/Modify
- `static/index.html` → `public/index.html`

### Can Delete (after migration)
- `main.py` (not needed on Vercel)
- `routes.py` (logic moved to api/ files)
- `models.py` (replaced by Neon + SQL)

### Keep
- `requirements.txt` (updated)
- `.env.example` (updated with new vars)

---

## Notes

- **Voice input code requires ZERO changes** - it's all client-side JavaScript
- **HTTPS is automatic** on Vercel - iPhone Safari voice will work!
- **Database migrations** handled manually in Neon console for now (simple schema)
- **Connection pooling** handled by Neon automatically

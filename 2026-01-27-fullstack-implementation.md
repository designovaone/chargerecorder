# Plan: Migrate Charge Recorder to Next.js + Neon PostgreSQL

## Overview

Convert from FastAPI/SQLite to Next.js 16 (App Router) + Neon PostgreSQL for Vercel deployment. This aligns with the existing agent guidelines (TypeScript-focused coder-agent, ui-agent).

**Next.js 16 considerations:**
- Async Request APIs: `params`, `cookies()`, `headers()` must be awaited
- Caching is opt-in with `"use cache"` directive (not needed for this app)
- Turbopack is default for faster builds

**Voice-to-text:** Stays in browser (Safari Web Speech API) - ZERO changes needed

---

## Current Architecture

```
FastAPI (Python)
├── routes.py          # All API endpoints
├── models.py          # SQLAlchemy + SQLite
└── static/index.html  # Vanilla JS frontend
```

---

## Target Architecture (Next.js + Neon)

```
chargerecorder/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main page (React version of index.html)
│   ├── globals.css          # Tailwind styles
│   └── api/
│       ├── unlock/route.ts      # POST /api/unlock
│       ├── status/route.ts      # GET /api/status
│       ├── sessions/
│       │   ├── route.ts         # GET, POST, DELETE /api/sessions
│       │   ├── [id]/route.ts    # DELETE /api/sessions/:id
│       │   └── csv/route.ts     # GET /api/sessions/csv
│       └── health/route.ts      # GET /api/health
├── components/
│   ├── UnlockScreen.tsx
│   ├── StatusBanner.tsx
│   ├── VoiceInput.tsx
│   ├── ManualInput.tsx
│   ├── SessionHistory.tsx
│   └── ExportButton.tsx
├── lib/
│   ├── db.ts               # Neon connection
│   ├── auth.ts             # Session verification
│   └── types.ts            # TypeScript types
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── .env.example
```

---

## Implementation Phases

### Phase 1: Project Setup

**Tasks for Coder Agent:**

1. Initialize Next.js 14 project with TypeScript
2. Configure Tailwind CSS
3. Set up environment variables

```bash
# Commands (run in project root)
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

**Files to create:**

#### `.env.example`
```env
NEON_DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
UNLOCK_PHRASE=your-secret-phrase
```

#### `.env.local` (gitignored)
```env
NEON_DATABASE_URL=<from Neon console>
UNLOCK_PHRASE=<your passphrase>
```

---

### Phase 2: Database Setup

**Tasks for Coder Agent:**

1. Create Neon database
2. Create schema
3. Set up connection pool

#### Neon SQL Schema
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

#### `lib/db.ts`
```typescript
import { neon } from '@neondatabase/serverless';

if (!process.env.NEON_DATABASE_URL) {
  throw new Error('NEON_DATABASE_URL is not set');
}

export const sql = neon(process.env.NEON_DATABASE_URL);
```

#### `lib/types.ts`
```typescript
export interface ChargingSession {
  id: number;
  start_percentage: number;
  start_time: string;
  end_percentage: number | null;
  end_time: string | null;
}

export type SessionType = 'start' | 'end';

export interface SessionRequest {
  percentage: number;
  type: SessionType;
}

export interface StatusResponse {
  status: 'charging' | 'idle';
  start_percentage?: number;
  start_time?: string;
}
```

---

### Phase 3: Authentication

**Tasks for Coder Agent:**

#### `lib/auth.ts`
```typescript
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'chargerecorder_session';
const UNLOCK_PHRASE = process.env.UNLOCK_PHRASE || '';

export async function verifyAuth(): Promise<boolean> {
  if (!UNLOCK_PHRASE) return true;

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  return session?.value === UNLOCK_PHRASE;
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { detail: 'Unauthorized' },
    { status: 401 }
  );
}

export function setSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, UNLOCK_PHRASE, {
    httpOnly: true,
    maxAge: 86400, // 24 hours
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
```

---

### Phase 4: API Routes

**Tasks for Coder Agent:**

#### `app/api/unlock/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';

const UNLOCK_PHRASE = process.env.UNLOCK_PHRASE || '';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { phrase } = body;

  if (!UNLOCK_PHRASE) {
    return NextResponse.json({ success: true, message: 'No passphrase configured' });
  }

  if (phrase === UNLOCK_PHRASE) {
    const response = NextResponse.json({ success: true, message: 'Unlocked' });
    return setSessionCookie(response);
  }

  return NextResponse.json({ success: false, message: 'Incorrect passphrase' });
}
```

#### `app/api/status/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export async function GET() {
  if (!(await verifyAuth())) return unauthorizedResponse();

  const result = await sql`
    SELECT start_percentage, start_time
    FROM charging_sessions
    WHERE end_percentage IS NULL
    ORDER BY start_time DESC
    LIMIT 1
  `;

  if (result.length > 0) {
    return NextResponse.json({
      status: 'charging',
      start_percentage: result[0].start_percentage,
      start_time: result[0].start_time,
    });
  }

  return NextResponse.json({ status: 'idle' });
}
```

#### `app/api/sessions/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import type { SessionRequest } from '@/lib/types';

export async function GET() {
  if (!(await verifyAuth())) return unauthorizedResponse();

  const sessions = await sql`
    SELECT id, start_percentage, start_time, end_percentage, end_time
    FROM charging_sessions
    ORDER BY start_time DESC
  `;

  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) return unauthorizedResponse();

  const body: SessionRequest = await request.json();
  const { percentage, type } = body;

  if (percentage < 0 || percentage > 100) {
    return NextResponse.json(
      { detail: 'Percentage must be between 0 and 100' },
      { status: 400 }
    );
  }

  if (type === 'start') {
    const result = await sql`
      INSERT INTO charging_sessions (start_percentage, start_time)
      VALUES (${percentage}, NOW())
      RETURNING id, start_percentage, start_time
    `;

    return NextResponse.json({
      message: `Recorded ${percentage}% as start charge`,
      session: result[0],
    });
  }

  if (type === 'end') {
    const openSession = await sql`
      SELECT id FROM charging_sessions
      WHERE end_percentage IS NULL
      ORDER BY start_time DESC
      LIMIT 1
    `;

    if (openSession.length === 0) {
      return NextResponse.json(
        { detail: 'No active charging session found' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE charging_sessions
      SET end_percentage = ${percentage}, end_time = NOW()
      WHERE id = ${openSession[0].id}
      RETURNING id, start_percentage, start_time, end_percentage, end_time
    `;

    return NextResponse.json({
      message: `Recorded ${percentage}% as end charge`,
      session: result[0],
    });
  }

  return NextResponse.json(
    { detail: "Type must be 'start' or 'end'" },
    { status: 400 }
  );
}

export async function DELETE() {
  if (!(await verifyAuth())) return unauthorizedResponse();

  await sql`DELETE FROM charging_sessions`;

  return NextResponse.json({ message: 'All sessions deleted' });
}
```

#### `app/api/sessions/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAuth())) return unauthorizedResponse();

  const { id } = await params;
  const sessionId = parseInt(id, 10);

  const result = await sql`
    DELETE FROM charging_sessions
    WHERE id = ${sessionId}
    RETURNING id
  `;

  if (result.length === 0) {
    return NextResponse.json(
      { detail: 'Session not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: 'Session deleted' });
}
```

#### `app/api/sessions/csv/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export async function GET() {
  if (!(await verifyAuth())) return unauthorizedResponse();

  const sessions = await sql`
    SELECT start_percentage, start_time, end_percentage, end_time
    FROM charging_sessions
    ORDER BY start_time ASC
  `;

  const header = 'start_percentage,start_datetime,end_percentage,end_datetime\n';
  const rows = sessions.map(s =>
    `${s.start_percentage},${s.start_time},${s.end_percentage ?? ''},${s.end_time ?? ''}`
  ).join('\n');

  return new NextResponse(header + rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=charging_sessions.csv',
    },
  });
}
```

#### `app/api/health/route.ts`
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
```

---

### Phase 5: React Components

**Tasks for UI Agent (follow dark theme guidelines):**

#### `app/page.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import UnlockScreen from '@/components/UnlockScreen';
import StatusBanner from '@/components/StatusBanner';
import VoiceInput from '@/components/VoiceInput';
import ManualInput from '@/components/ManualInput';
import SessionHistory from '@/components/SessionHistory';
import ExportButton from '@/components/ExportButton';

export default function Home() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/status');
      setIsUnlocked(res.ok);
    } catch {
      setIsUnlocked(false);
    } finally {
      setIsLoading(false);
    }
  }

  function triggerRefresh() {
    setRefreshKey(k => k + 1);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isUnlocked) {
    return <UnlockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col">
      <StatusBanner refreshKey={refreshKey} />

      <div className="flex-1 flex flex-col p-4 space-y-4">
        <VoiceInput onSubmit={triggerRefresh} />
        <ManualInput onSubmit={triggerRefresh} />
        <SessionHistory refreshKey={refreshKey} onDelete={triggerRefresh} />
      </div>

      <ExportButton />
    </main>
  );
}
```

#### Component files (create in `/components/`):
- `UnlockScreen.tsx` - Passphrase entry form
- `StatusBanner.tsx` - Shows "Charging since..." or "No active charge"
- `VoiceInput.tsx` - Mic button with Web Speech API (port existing JS)
- `ManualInput.tsx` - Text input + Start/Stop buttons
- `SessionHistory.tsx` - List of sessions with delete buttons
- `ExportButton.tsx` - CSV download button

---

### Phase 6: Configuration Files

#### `package.json` dependencies
```json
{
  "dependencies": {
    "@neondatabase/serverless": "^0.10.0",
    "next": "^16.1.0",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^4.0",
    "postcss": "^8"
  }
}
```

> **Note:** Next.js 16 requires React 19. Tailwind CSS 4.0 no longer requires autoprefixer.

#### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for smaller deployments
  output: 'standalone',
};

module.exports = nextConfig;
```

---

### Phase 7: Deployment

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Set environment variables in Vercel dashboard:**
   - `NEON_DATABASE_URL`
   - `UNLOCK_PHRASE`
4. **Deploy**

---

## Task Breakdown for Orchestration

### Task 1: Project Initialization
- **Agent:** Coder Agent
- **Action:** Create Next.js project, install dependencies
- **Files:** `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.js`

### Task 2: Database & Types
- **Agent:** Coder Agent
- **Action:** Set up Neon connection, TypeScript types
- **Files:** `lib/db.ts`, `lib/types.ts`, `lib/auth.ts`

### Task 3: API Routes
- **Agent:** Coder Agent
- **Action:** Implement all API endpoints
- **Files:** All files in `app/api/`

### Task 4: React Components
- **Agent:** UI Agent (verify) + Coder Agent (implement)
- **Action:** Create React components, port voice input
- **Files:** All files in `components/`, `app/page.tsx`

### Task 5: Code Review
- **Agent:** Code Reviewer Agent
- **Action:** Review for completeness, security, performance
- **Checklist:**
  - [ ] All API endpoints match original functionality
  - [ ] Auth implemented correctly (cookie-based)
  - [ ] Input validation on all endpoints
  - [ ] TypeScript strict mode compliance
  - [ ] No exposed secrets
  - [ ] Error handling complete

### Task 6: Testing & Deployment
- **Agent:** Coder Agent
- **Action:** Local testing, Vercel deployment
- **Verification:** All checklist items from original plan

---

## Verification Checklist

- [ ] Neon database created with correct schema
- [ ] All API endpoints deployed
- [ ] Environment variables set in Vercel
- [ ] Frontend loads correctly
- [ ] Unlock works with passphrase
- [ ] Can record start charge via text
- [ ] Can record end charge via text
- [ ] Voice input works on macOS Safari
- [ ] Voice input works on iPhone Safari (HTTPS!)
- [ ] History displays correctly
- [ ] Delete single session works
- [ ] Clear all sessions works
- [ ] CSV export works

---

## Files Summary

### New Files to Create
```
app/
├── layout.tsx
├── page.tsx
├── globals.css
└── api/
    ├── unlock/route.ts
    ├── status/route.ts
    ├── sessions/route.ts
    ├── sessions/[id]/route.ts
    ├── sessions/csv/route.ts
    └── health/route.ts

components/
├── UnlockScreen.tsx
├── StatusBanner.tsx
├── VoiceInput.tsx
├── ManualInput.tsx
├── SessionHistory.tsx
└── ExportButton.tsx

lib/
├── db.ts
├── auth.ts
└── types.ts

Configuration:
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── .env.example
└── .gitignore (update)
```

### Files to Keep (reference only)
- `CLAUDE.md` - Specification
- `agents/` - Agent guidelines
- `static/index.html` - Reference for porting frontend logic

### Files to Remove (after migration verified)
- `main.py`
- `routes.py`
- `models.py`
- `requirements.txt`
- `data/` directory

---

## Notes

- **Voice input code:** Port directly from `static/index.html` - Web Speech API stays client-side
- **HTTPS automatic:** Vercel provides SSL - iPhone Safari voice will work
- **Type safety:** Full TypeScript with strict mode
- **Agent alignment:** Code follows coder-agent guidelines (TypeScript strict, JSDoc, error handling)
- **Security:** Using latest Next.js 16.1.x addresses CVE-2025-55182, CVE-2025-55183, CVE-2025-55184

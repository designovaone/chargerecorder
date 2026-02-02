import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import type { SessionRequest, ChargingSession, ErrorResponse, SessionsResponse, SessionResponse } from '@/lib/types';

/**
 * GET /api/sessions
 * Returns all charging sessions ordered by start time (newest first).
 * Requires authentication.
 */
export async function GET() {
  if (!(await verifyAuth())) return unauthorizedResponse();

  const sessions = await sql`
    SELECT id, start_percentage, start_time, end_percentage, end_time
    FROM charging_sessions
    ORDER BY start_time DESC
  `;

  const response: SessionsResponse = { sessions: sessions as ChargingSession[] };
  return NextResponse.json(response);
}

/**
 * POST /api/sessions
 * Creates a new session (type: 'start') or ends the most recent open session (type: 'end').
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) return unauthorizedResponse();

  const body: SessionRequest = await request.json();
  const { percentage, type } = body;

  // Validate percentage
  if (percentage < 0 || percentage > 100) {
    const error: ErrorResponse = {
      detail: 'Percentage must be between 0 and 100',
    };
    return NextResponse.json(error, { status: 400 });
  }

  if (type === 'start') {
    const result = await sql`
      INSERT INTO charging_sessions (start_percentage, start_time)
      VALUES (${percentage}, NOW())
      RETURNING id, start_percentage, start_time
    ` as unknown as ChargingSession[];

    const response: SessionResponse = {
      message: `Recorded ${percentage}% as start charge`,
      session: result[0] as ChargingSession,
    };
    return NextResponse.json(response);
  }

  if (type === 'end') {
    const openSession = await sql`
      SELECT id FROM charging_sessions
      WHERE end_percentage IS NULL
      ORDER BY start_time DESC
      LIMIT 1
    ` as unknown as { id: number }[];

    if (openSession.length === 0) {
      const error: ErrorResponse = {
        detail: 'No active charging session found',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const result = await sql`
      UPDATE charging_sessions
      SET end_percentage = ${percentage}, end_time = NOW()
      WHERE id = ${openSession[0].id}
      RETURNING id, start_percentage, start_time, end_percentage, end_time
    ` as unknown as ChargingSession[];

    const response: SessionResponse = {
      message: `Recorded ${percentage}% as end charge`,
      session: result[0] as ChargingSession,
    };
    return NextResponse.json(response);
  }

  const error: ErrorResponse = {
    detail: "Type must be 'start' or 'end'",
  };
  return NextResponse.json(error, { status: 400 });
}

/**
 * DELETE /api/sessions
 * Deletes all charging sessions.
 * Requires authentication.
 */
export async function DELETE() {
  if (!(await verifyAuth())) return unauthorizedResponse();

  await sql`DELETE FROM charging_sessions`;

  return NextResponse.json({ message: 'All sessions deleted' });
}

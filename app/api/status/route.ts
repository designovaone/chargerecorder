import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import type { StatusResponse } from '@/lib/types';

/**
 * GET /api/status
 * Returns the current charging status (idle or charging).
 * Requires authentication.
 */
export async function GET() {
  if (!(await verifyAuth())) return unauthorizedResponse();

  const result = await sql`
    SELECT start_percentage, start_time
    FROM charging_sessions
    WHERE end_percentage IS NULL
    ORDER BY start_time DESC
    LIMIT 1
  ` as unknown as { start_percentage: number; start_time: string }[];

  if (result.length > 0) {
    const status: StatusResponse = {
      status: 'charging',
      start_percentage: result[0].start_percentage,
      start_time: result[0].start_time,
    };
    return NextResponse.json(status);
  }

  const status: StatusResponse = {
    status: 'idle',
  };
  return NextResponse.json(status);
}

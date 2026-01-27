import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

/**
 * GET /api/sessions/csv
 * Returns all charging sessions as a downloadable CSV file.
 * Requires authentication.
 */
export async function GET() {
  if (!(await verifyAuth())) return unauthorizedResponse();

  const sessions = await sql`
    SELECT start_percentage, start_time, end_percentage, end_time
    FROM charging_sessions
    ORDER BY start_time ASC
  `;

  const header = 'start_percentage,start_datetime,end_percentage,end_datetime\n';
  const rows = sessions.map((s) =>
    `${s.start_percentage},${s.start_time},${s.end_percentage ?? ''},${s.end_time ?? ''}`
  ).join('\n');

  return new NextResponse(header + rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=charging_sessions.csv',
    },
  });
}

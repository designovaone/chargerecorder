import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Health check endpoint for deployment monitoring.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

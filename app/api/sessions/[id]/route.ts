import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import type { ErrorResponse } from '@/lib/types';

/**
 * DELETE /api/sessions/:id
 * Deletes a specific charging session by ID.
 * Requires authentication.
 */
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
    const error: ErrorResponse = {
      detail: 'Session not found',
    };
    return NextResponse.json(error, { status: 404 });
  }

  return NextResponse.json({ message: 'Session deleted' });
}

import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';
import type { UnlockResponse } from '@/lib/types';

const UNLOCK_PHRASE = process.env.UNLOCK_PHRASE || '';

/**
 * POST /api/unlock
 * Authenticates user by verifying passphrase and sets session cookie.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { phrase } = body as { phrase: string };

  if (!UNLOCK_PHRASE) {
    const response: UnlockResponse = {
      success: true,
      message: 'No passphrase configured',
    };
    return NextResponse.json(response);
  }

  if (phrase === UNLOCK_PHRASE) {
    const response: UnlockResponse = {
      success: true,
      message: 'Unlocked',
    };
    return setSessionCookie(NextResponse.json(response));
  }

  const errorResponse: UnlockResponse = {
    success: false,
    message: 'Incorrect passphrase',
  };
  return NextResponse.json(errorResponse);
}

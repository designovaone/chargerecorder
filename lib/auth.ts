import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'chargerecorder_session';
const UNLOCK_PHRASE = process.env.UNLOCK_PHRASE || '';

/**
 * Verifies if the user is authenticated via session cookie.
 * Must be awaited in Next.js 16 due to async Request APIs.
 *
 * @returns Promise<boolean> - true if authenticated
 */
export async function verifyAuth(): Promise<boolean> {
  if (!UNLOCK_PHRASE) return true;

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  return session?.value === UNLOCK_PHRASE;
}

/**
 * Returns a standardized 401 Unauthorized response.
 *
 * @returns NextResponse with 401 status
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { detail: 'Unauthorized' },
    { status: 401 }
  );
}

/**
 * Sets the session cookie on a response.
 *
 * @param response - The NextResponse to modify
 * @returns The modified NextResponse with session cookie set
 */
export function setSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, UNLOCK_PHRASE, {
    httpOnly: true,
    maxAge: 86400, // 24 hours
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}

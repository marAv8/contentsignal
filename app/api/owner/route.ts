import { NextRequest, NextResponse } from 'next/server';
import { OWNER_COOKIE, SESSION_SECONDS, createOwnerSession, ownerAuthConfigured, validOwnerKey } from '@/lib/owner-session';
export const runtime = 'nodejs';
let failedAttempts = 0;
let windowStart = Date.now();
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  let sameOrigin = false;
  try { sameOrigin = Boolean(origin) && new URL(origin!).host === request.headers.get('host') && ['http:', 'https:'].includes(new URL(origin!).protocol); } catch { /* invalid origin */ }
  if (!sameOrigin) {
    return NextResponse.json({ error: 'Request origin is not permitted.' }, { status: 403 });
  }
  if (Number(request.headers.get('content-length') || 0) > 2000) {
    return NextResponse.json({ error: 'Request too large.' }, { status: 413 });
  }
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Invalid form.' }, { status: 400 });
  const response = NextResponse.redirect(new URL('/', request.url), 303);
  response.headers.set('Cache-Control', 'no-store');
  if (form.get('action') === 'logout') {
    response.cookies.set(OWNER_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 });
    return response;
  }
  if (!ownerAuthConfigured()) return NextResponse.json({ error: 'Owner access is unavailable.' }, { status: 503 });
  if (Date.now() - windowStart > 15 * 60 * 1000) { windowStart = Date.now(); failedAttempts = 0; }
  if (failedAttempts >= 10) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  const key = form.get('key');
  if (typeof key !== 'string' || !validOwnerKey(key)) {
    failedAttempts += 1;
    return NextResponse.redirect(new URL('/owner?error=invalid', request.url), 303);
  }
  const session = await createOwnerSession();
  response.cookies.set(OWNER_COOKIE, session, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: SESSION_SECONDS });
  return response;
}

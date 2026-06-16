import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '../../../../lib/firebaseAdmin';
import { SESSION_CONFIG } from '../../../../lib/auth';
import { assertSameOrigin } from '../../../../lib/requestSecurity';
import { assertRateLimit, rateLimitKey } from '../../../../lib/rateLimit';

/**
 * POST /api/auth/session
 * Creates a Firebase session cookie from an ID token.
 * Called after client-side Firebase login.
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await assertRateLimit(rateLimitKey(request, 'auth-session'), 20, 60_000);
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token first
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.email_verified === false) {
      return NextResponse.json(
        { error: 'Verifikasi email Anda sebelum masuk.' },
        { status: 403 }
      );
    }

    // Create session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_CONFIG.expiresIn,
    });

    // Set the session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_CONFIG.name, sessionCookie, SESSION_CONFIG.options);

    return response;
  } catch (error: unknown) {
    console.error('Session creation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create session';
    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Clears the session cookie (logout).
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_CONFIG.name, '', {
    ...SESSION_CONFIG.options,
    maxAge: 0,
  });
  return response;
}

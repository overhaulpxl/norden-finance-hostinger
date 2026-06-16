import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '../../../../lib/authEmail';
import { getAdminAuth } from '../../../../lib/firebaseAdmin';
import { prisma } from '../../../../lib/prisma';
import { assertRateLimit, rateLimitKey } from '../../../../lib/rateLimit';
import { assertSameOrigin } from '../../../../lib/requestSecurity';

function normalizeAuthError(error: unknown): { code: string; message: string; status: number } {
  console.error("[Resend Verification]", error);

  let errorCode = 'UNKNOWN_ERROR';
  let message = 'Gagal mengirim email verifikasi. Silakan coba lagi.';
  let status = 500;

  if (error && typeof error === 'object') {
    const errObj = error as Record<string, unknown>;
    const code = typeof errObj.code === 'string' ? errObj.code : '';
    const errMsg = typeof errObj.message === 'string' ? errObj.message : '';

    let rawFirebaseMessage = '';
    if (typeof errMsg === 'string') {
      if (errMsg.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
        rawFirebaseMessage = 'TOO_MANY_ATTEMPTS_TRY_LATER';
      } else if (errMsg.includes('too-many-requests') || errMsg.includes('TOO_MANY_REQUESTS')) {
        rawFirebaseMessage = 'auth/too-many-requests';
      } else if (errMsg.includes('user-not-found')) {
        rawFirebaseMessage = 'auth/user-not-found';
      } else if (errMsg.includes('invalid-email')) {
        rawFirebaseMessage = 'auth/invalid-email';
      }

      try {
        const jsonMatch = errMsg.match(/\{.*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed?.error?.message) {
            rawFirebaseMessage = parsed.error.message;
          }
        }
      } catch {
        // ignore JSON parsing errors
      }
    }

    const searchTarget = `${code || ''} ${rawFirebaseMessage} ${errMsg}`.toLowerCase();

    if (searchTarget.includes('too_many_attempts_try_later') || searchTarget.includes('too-many-attempts')) {
      errorCode = 'TOO_MANY_ATTEMPTS';
      message = 'Terlalu banyak percobaan. Silakan tunggu beberapa menit sebelum mengirim ulang email verifikasi.';
      status = 429;
    } else if (searchTarget.includes('too-many-requests') || searchTarget.includes('too_many_requests')) {
      errorCode = 'TOO_MANY_REQUESTS';
      message = 'Terlalu banyak percobaan. Silakan coba lagi nanti.';
      status = 429;
    } else if (searchTarget.includes('user-not-found') || searchTarget.includes('user_not_found')) {
      errorCode = 'USER_NOT_FOUND';
      message = 'Akun tidak ditemukan.';
      status = 404;
    } else if (searchTarget.includes('invalid-email') || searchTarget.includes('invalid_email')) {
      errorCode = 'INVALID_EMAIL';
      message = 'Email tidak valid.';
      status = 400;
    } else if (searchTarget.includes('resend_not_configured')) {
      errorCode = 'RESEND_NOT_CONFIGURED';
      message = 'Layanan email belum dikonfigurasi. Silakan hubungi support.';
      status = 503;
    } else if (searchTarget.includes('onboarding@resend.dev') || searchTarget.includes('restricted') || searchTarget.includes('testing') || searchTarget.includes('validation')) {
      errorCode = 'TESTING_RESTRICTION';
      message = 'Email verifikasi tidak dapat dikirim ke email ini karena batasan akun pengirim uji coba. Hubungi administrator atau gunakan Firebase Auth default.';
      status = 403;
    }
  } else if (typeof error === 'string') {
    const searchTarget = error.toLowerCase();
    if (searchTarget.includes('too_many_attempts_try_later')) {
      errorCode = 'TOO_MANY_ATTEMPTS';
      message = 'Terlalu banyak percobaan. Silakan tunggu beberapa menit sebelum mengirim ulang email verifikasi.';
      status = 429;
    } else if (searchTarget.includes('too-many-requests')) {
      errorCode = 'TOO_MANY_REQUESTS';
      message = 'Terlalu banyak percobaan. Silakan coba lagi nanti.';
      status = 429;
    } else if (searchTarget.includes('resend_not_configured')) {
      errorCode = 'RESEND_NOT_CONFIGURED';
      message = 'Layanan email belum dikonfigurasi. Silakan hubungi support.';
      status = 503;
    } else if (searchTarget.includes('onboarding@resend.dev') || searchTarget.includes('restricted') || searchTarget.includes('testing') || searchTarget.includes('validation')) {
      errorCode = 'TESTING_RESTRICTION';
      message = 'Email verifikasi tidak dapat dikirim ke email ini karena batasan akun pengirim uji coba. Hubungi administrator atau gunakan Firebase Auth default.';
      status = 403;
    }
  }

  return { code: errorCode, message, status };
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);

    // IP-based limit (5 requests per 60 seconds)
    try {
      await assertRateLimit(rateLimitKey(request, 'auth-resend-verification'), 5, 60_000);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: 'RATE_LIMITED',
          code: 'RATE_LIMITED',
          message: 'Please wait before requesting another verification email.'
        },
        { status: 429 }
      );
    }

    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ ok: false, error: 'ID token is required', message: 'ID token is required' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.email_verified) {
      return NextResponse.json({ ok: true, success: true, alreadyVerified: true });
    }

    // Per-user/per-email rate limit check:
    // Minimum interval: 60 seconds (1 request per 60s)
    // Stronger limit: max 3 requests per 15 minutes
    try {
      await assertRateLimit(`resend-uid-min:${decodedToken.uid}`, 1, 60_000);
      await assertRateLimit(`resend-uid-15m:${decodedToken.uid}`, 3, 15 * 60_000);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: 'RATE_LIMITED',
          code: 'RATE_LIMITED',
          message: 'Please wait before requesting another verification email.'
        },
        { status: 429 }
      );
    }

    const provider = process.env.EMAIL_VERIFICATION_PROVIDER || 'firebase';
    const emailFrom = process.env.EMAIL_FROM || '';

    let activeProvider = provider;
    if (provider === 'resend' && emailFrom.includes('onboarding@resend.dev')) {
      console.warn('Resend testing sender detected. Falling back to Firebase verification.');
      activeProvider = 'firebase';
    }

    if (activeProvider === 'firebase') {
      return NextResponse.json(
        {
          ok: false,
          code: 'USE_CLIENT_VERIFICATION',
          message: 'Layanan email verifikasi dikonfigurasi melalui Firebase client.'
        },
        { status: 400 }
      );
    }

    const email = decodedToken.email || (await adminAuth.getUser(decodedToken.uid)).email;
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Email tidak tersedia untuk akun ini.', message: 'Email tidak tersedia untuk akun ini.' }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: decodedToken.uid },
      select: { fullName: true },
    });

    const result = await sendVerificationEmail({
      email,
      userName: profile?.fullName || null,
    });

    if ('skipped' in result) {
      return NextResponse.json(
        {
          ok: false,
          code: 'RESEND_NOT_CONFIGURED',
          message: 'Layanan email belum dikonfigurasi. Silakan hubungi support.'
        },
        { status: 503 }
      );
    }

    if ('error' in result) {
      const normalized = normalizeAuthError(result.error);
      return NextResponse.json(
        {
          ok: false,
          code: normalized.code,
          message: normalized.message
        },
        { status: normalized.status }
      );
    }

    return NextResponse.json({ ok: true, success: true });
  } catch (error: unknown) {
    const normalized = normalizeAuthError(error);
    return NextResponse.json(
      {
        ok: false,
        code: normalized.code,
        message: normalized.message
      },
      { status: normalized.status }
    );
  }
}


import { cookies } from 'next/headers';
import { getAdminAuth } from './firebaseAdmin';
import { prisma } from './prisma';

const SESSION_COOKIE_NAME = '__session';
const SESSION_EXPIRY_DAYS = 5;

export interface AuthUser {
  uid: string;
  email: string;
}

/**
 * Get the current user from the Firebase session cookie.
 * Returns null if no valid session exists.
 * Used in server components and server actions.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) return null;

    const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || '',
    };
  } catch {
    return null;
  }
}

/**
 * Require an authenticated user with an active plan.
 * Throws if not logged in, or if plan is expired and isWriteAction is true.
 * All server actions that modify data should call this with isWriteAction=true.
 */
export async function requireUser(isWriteAction = false) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Anda harus login terlebih dahulu.');
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.uid },
    select: {
      id: true,
      userId: true,
      role: true,
      plan: true,
      trialStartedAt: true,
      trialEndsAt: true,
      onboardingCompleted: true,
      fullName: true,
    },
  });

  if (!profile) {
    throw new Error('Profil tidak ditemukan.');
  }

  if (isWriteAction) {
    // Check trial expiration
    if (profile.plan === 'trial') {
      const now = new Date();
      if (now > profile.trialEndsAt) {
        throw new Error('Masa trial Anda telah berakhir. Upgrade ke Pro untuk melanjutkan.');
      }
    }

    // Check pro subscription status
    if (profile.plan === 'pro') {
      const billing = await prisma.billingSubscription.findFirst({
        where: {
          userId: user.uid,
          plan: 'pro',
          status: 'active',
        },
      });

      if (!billing) {
        throw new Error('Langganan Pro Anda tidak aktif. Upgrade ke Pro untuk melanjutkan.');
      }
    }
  }

  return { user, profile };
}

/**
 * Session cookie configuration
 */
export const SESSION_CONFIG = {
  name: SESSION_COOKIE_NAME,
  expiresIn: SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000, // 5 days in ms
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // 5 days in seconds
  },
};

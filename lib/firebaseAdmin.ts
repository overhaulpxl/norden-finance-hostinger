import { getApps, initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { getPublicAppUrl } from './appUrl';

type DecodedToken = {
  uid?: string;
  sub?: string;
  user_id?: string;
  email?: string;
  email_verified?: boolean;
  [key: string]: unknown;
};

type AdminAuthLike = {
  verifyIdToken: (idToken: string) => Promise<DecodedToken & { uid: string }>;
  createSessionCookie: (idToken: string, options: { expiresIn: number }) => Promise<string>;
  verifySessionCookie: (sessionCookie: string, checkRevoked?: boolean) => Promise<DecodedToken & { uid: string }>;
  getUser: (uid: string) => Promise<{ uid: string; email?: string }>;
  generateEmailVerificationLink: (email: string, actionCodeSettings?: { url: string; handleCodeInApp: boolean }) => Promise<string>;
  deleteUser?: (uid: string) => Promise<void>;
};

function adminEnv(name: string): string | undefined {
  return process.env[name];
}

function requiredAdminEnv(name: string): string {
  const value = adminEnv(name);
  if (!value) {
    throw new Error(`${name} is required for Firebase Admin`);
  }
  return value;
}

function ensureFirebaseAdminApp() {
  if (getApps().length > 0) return;

  const serviceAccount: ServiceAccount = {
    projectId: requiredAdminEnv('FIREBASE_PROJECT_ID'),
    clientEmail: requiredAdminEnv('FIREBASE_CLIENT_EMAIL'),
    privateKey: requiredAdminEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  };

  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

function decodeJwt(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = typeof Buffer !== 'undefined'
      ? Buffer.from(payloadB64, 'base64').toString('utf8')
      : atob(payloadB64);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

function withUid(decoded: DecodedToken) {
  const uid = decoded.uid || decoded.sub || decoded.user_id;
  if (!uid) {
    throw new Error('Firebase token is missing a uid');
  }
  return {
    ...decoded,
    uid,
  };
}

export function getAdminAuth(): AdminAuthLike {
  const isConfigured =
    adminEnv('FIREBASE_PROJECT_ID') &&
    adminEnv('FIREBASE_CLIENT_EMAIL') &&
    adminEnv('FIREBASE_PRIVATE_KEY');

  if (isConfigured) {
    ensureFirebaseAdminApp();
    return getAuth();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Firebase Admin environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are required in production.');
  }

  // Fallback for local development (no service account JSON configured)
  return {
    verifyIdToken: async (idToken: string) => {
      const decoded = decodeJwt(idToken);
      if (!decoded) {
        throw new Error('Invalid Firebase ID token received in Mock Admin mode');
      }
      return withUid(decoded);
    },
    createSessionCookie: async (idToken: string) => {
      return idToken;
    },
    verifySessionCookie: async (sessionCookie: string) => {
      const decoded = decodeJwt(sessionCookie);
      if (!decoded) {
        throw new Error('Invalid session cookie in Mock Admin mode');
      }
      return withUid(decoded);
    },
    getUser: async (uid: string) => ({
      uid,
      email: uid.includes('@') ? uid : undefined,
    }),
    generateEmailVerificationLink: async (_email: string, actionCodeSettings?: { url: string }) => {
      return actionCodeSettings?.url || `${getPublicAppUrl()}/auth/verified`;
    },
  };
}

export function getAdminStorage() {
  const isConfigured =
    adminEnv('FIREBASE_PROJECT_ID') &&
    adminEnv('FIREBASE_CLIENT_EMAIL') &&
    adminEnv('FIREBASE_PRIVATE_KEY');

  if (isConfigured) {
    ensureFirebaseAdminApp();
    return getStorage();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Firebase Admin environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are required in production.');
  }

  // Fallback storage bucket mock for local development
  return {
    bucket: () => ({
      file: (filePath: string) => ({
        save: async () => {
          console.log(`[Mock Storage] Saved file: ${filePath}`);
          return;
        },
        getSignedUrl: async () => {
          console.log(`[Mock Storage] Generated signed URL for: ${filePath}`);
          return [`/api/mock-file?path=${encodeURIComponent(filePath)}`];
        },
        delete: async () => {
          console.log(`[Mock Storage] Deleted file: ${filePath}`);
          return;
        },
      }),
    }),
  };
}

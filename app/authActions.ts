'use client';

// ==========================================
// Norden Finance — Auth Actions (Client-Side)
// ==========================================
// These functions run on the CLIENT. They use Firebase Auth SDK
// to authenticate, then POST the ID token to our API routes
// to create a server-side session cookie.

import { auth } from '../lib/firebase';
import { getPublicAppUrl } from '../lib/appUrl';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from 'firebase/auth';

export async function loginAction(email: string, password: string) {
  if (!email || !password) {
    return { success: false, error: 'Email dan password harus diisi' };
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    if (!credential.user.emailVerified) {
      return {
        success: false,
        requiresEmailVerification: true,
        email: credential.user.email || email,
        error: 'Please verify your email before continuing.',
      };
    }
    const idToken = await credential.user.getIdToken();

    // Create session cookie on server
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || 'Gagal membuat sesi' };
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat masuk';
    // Firebase error messages cleanup
    if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
      return { success: false, error: 'Email atau password salah' };
    }
    if (message.includes('auth/user-not-found')) {
      return { success: false, error: 'Akun tidak ditemukan' };
    }
    if (message.includes('auth/too-many-requests')) {
      return { success: false, error: 'Terlalu banyak percobaan. Coba lagi nanti.' };
    }
    return { success: false, error: message };
  }
}

export async function registerAction(fullName: string, email: string, password: string) {
  if (!fullName || !email || !password) {
    return { success: false, error: 'Semua kolom wajib diisi' };
  }

  if (password.length < 8) {
    return { success: false, error: 'Password minimal 8 karakter' };
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, email.toLowerCase(), password);
    const idToken = await credential.user.getIdToken();

    // Register profile, but wait for email verification before creating a session.
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, fullName, createSession: false }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || 'Gagal membuat akun' };
    }

    const data = await res.json();
    if (data.requiresEmailVerification && data.emailVerificationProvider === 'firebase') {
      const appUrl = getPublicAppUrl(typeof window !== 'undefined' ? window.location.origin : undefined);
      await sendEmailVerification(credential.user, {
        url: `${appUrl.replace(/\/$/, '')}/auth/verified`
      });
    }

    return { success: true, requiresEmailVerification: true, email: credential.user.email || email.toLowerCase() };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat pendaftaran';
    if (message.includes('auth/email-already-in-use')) {
      return { success: false, error: 'Email sudah terdaftar' };
    }
    if (message.includes('auth/weak-password')) {
      return { success: false, error: 'Password terlalu lemah' };
    }
    return { success: false, error: message };
  }
}

export async function logoutAction() {
  try {
    // Clear session cookie on server
    await fetch('/api/auth/session', { method: 'DELETE' });
    // Sign out from Firebase client
    await signOut(auth);
    return { success: true };
  } catch {
    return { success: false, error: 'Gagal keluar' };
  }
}

export async function forgotPasswordAction(email: string) {
  if (!email) {
    return { success: false, error: 'Email harus diisi' };
  }

  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengirim email reset';
    if (message.includes('auth/user-not-found')) {
      return { success: false, error: 'Email tidak terdaftar' };
    }
    return { success: false, error: message };
  }
}

export async function loginWithGoogleAction() {
  try {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    const idToken = await credential.user.getIdToken();
    const fullName = credential.user.displayName || null;

    // Send token to /api/auth/register to verify and create profile if not exists
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, fullName }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || 'Gagal masuk dengan Google' };
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat masuk dengan Google';
    if (message.includes('auth/popup-closed-by-user')) {
      return { success: false, error: 'Proses login dibatalkan oleh pengguna.' };
    }
    return { success: false, error: message };
  }
}

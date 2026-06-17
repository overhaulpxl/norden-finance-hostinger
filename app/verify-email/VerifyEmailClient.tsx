'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { MailCheck, RefreshCw } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { getPublicAppUrl } from '../../lib/appUrl';
import { auth } from '../../lib/firebase';

const COOLDOWN_SECONDS = 60;

export default function VerifyEmailClient({ initialEmail }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail || '');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Email verifikasi sudah dikirim. Cek inbox atau spam.');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) setEmail(user.email);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const buttonLabel = useMemo(() => {
    if (loading) return 'Mengirim...';
    if (cooldown > 0) return `Kirim ulang dalam ${cooldown} detik`;
    return 'Kirim Ulang Email Verifikasi';
  }, [cooldown, loading]);

  async function sendFirebaseVerificationEmail(user: NonNullable<typeof auth.currentUser>) {
    const { sendEmailVerification } = await import('firebase/auth');
    const appUrl = getPublicAppUrl(window.location.origin);
    await sendEmailVerification(user, {
      url: `${appUrl.replace(/\/$/, '')}/auth/verified`,
    });
  }

  async function resendVerificationEmail() {
    setError(null);
    setMessage('');
    const user = auth.currentUser;
    if (!user) {
      setError('Silakan login kembali untuk meminta email verifikasi baru.');
      return;
    }

    setLoading(true);
    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 400 && data.code === 'USE_CLIENT_VERIFICATION') {
          await sendFirebaseVerificationEmail(user);
        } else {
          setError(data.message || data.error || 'Gagal mengirim email verifikasi. Silakan coba lagi.');
          if (
            response.status === 429 ||
            data.code === 'RATE_LIMITED' ||
            data.code === 'TOO_MANY_ATTEMPTS' ||
            data.code === 'TOO_MANY_REQUESTS'
          ) {
            setCooldown(COOLDOWN_SECONDS);
          }
          return;
        }
      }

      setMessage('Email verifikasi berhasil dikirim ulang. Cek inbox atau spam.');
      setCooldown(COOLDOWN_SECONDS);
    } catch (err: unknown) {
      console.error(err);
      const errMessage = err instanceof Error ? err.message : '';
      if (errMessage.includes('auth/too-many-requests')) {
        setError('Terlalu banyak percobaan. Tunggu beberapa menit sebelum mencoba lagi.');
        setCooldown(COOLDOWN_SECONDS);
      } else {
        setError('Gagal mengirim email verifikasi. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAF9F5] p-4 text-black selection:bg-black selection:text-[#FFE066]">
      <style>{`
        .bg-paper-dots {
          background-image: radial-gradient(rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
      `}</style>
      <div className="bg-paper-dots pointer-events-none absolute inset-0 opacity-80" />

      <main className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <BrandLogo variant="horizontal" priority className="h-16 w-auto" />
        </div>

        <section className="brutal-card border-[3px] border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-5 inline-flex border-[3px] border-black bg-[#FFE066] p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <MailCheck className="h-6 w-6 stroke-[3px]" />
          </div>
          <h1 className="mb-2 text-2xl font-black uppercase tracking-wider text-black">Cek Email Anda</h1>
          <p className="mb-5 text-sm font-bold leading-relaxed text-slate-600">
            Email verifikasi sudah dikirim. Cek inbox atau spam, lalu klik link verifikasi.
          </p>

          <div className="mb-5 border-[3px] border-black bg-[#FAF9F5] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Email</p>
            <p className="mt-1 break-all text-sm font-black text-black">{email || 'Your account email'}</p>
          </div>

          {message && (
            <div className="mb-4 border-[3px] border-black bg-[#bbf7d0] p-3 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 border-[3px] border-black bg-red-100 p-3 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={resendVerificationEmail}
            disabled={loading || cooldown > 0}
            className="mb-4 flex w-full items-center justify-center gap-2 border-[3px] border-black bg-[#FFE066] py-4 text-xs font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 stroke-[3px] ${loading ? 'animate-spin' : ''}`} />
            {buttonLabel}
          </button>

          <Link
            href="/login"
            className="block w-full border-[3px] border-black bg-white py-4 text-center text-xs font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000]"
          >
            Back to Login
          </Link>
        </section>
      </main>
    </div>
  );
}

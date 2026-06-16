'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginWithGoogleAction, registerAction } from '../authActions';
import BrandLogo from '../../components/BrandLogo';

export default function RegisterClient({ trialDays }: { trialDays: number }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!acceptedLegal) {
      setError('Anda harus menyetujui Terms of Service dan Privacy Policy.');
      return;
    }

    setLoading(true);

    const result = await registerAction(fullName, email, password);

    setLoading(false);
    if (result.success && 'requiresEmailVerification' in result && result.requiresEmailVerification) {
      setSuccess('Email verifikasi sudah dikirim. Verifikasi email Anda, lalu login.');
      const targetEmail = 'email' in result && result.email ? result.email : email;
      router.push(`/verify-email?email=${encodeURIComponent(targetEmail)}`);
    } else if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Terjadi kesalahan');
    }
  }

  async function handleGoogleRegister() {
    setError(null);
    setLoading(true);

    const result = await loginWithGoogleAction();

    setLoading(false);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Gagal mendaftar dengan Google');
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-black selection:bg-black selection:text-[#FFE066] flex flex-col justify-center items-center p-4 py-12 relative overflow-hidden select-none">
      <style>{`
        .bg-paper-dots {
          background-image: radial-gradient(rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
      `}</style>

      <div className="absolute inset-0 bg-paper-dots pointer-events-none opacity-80 z-0"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <BrandLogo variant="horizontal" priority className="h-16 w-auto" />
        </div>

        <div className="brutal-card p-8 bg-white border-[3px] border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black text-black uppercase tracking-wider mb-2">Buat Akun Baru</h2>
          <p className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-wide">Mulai uji coba gratis {trialDays} hari Anda sekarang.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border-[3px] border-black text-black font-bold text-sm rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-[#2ECC71]/20 border-[3px] border-black text-black font-bold text-sm rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              {success}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full bg-white text-black border-[3px] border-black py-3.5 text-xs font-black uppercase tracking-wider flex justify-center items-center gap-3 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all rounded-none cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Daftar dengan Google
          </button>

          <div className="flex items-center justify-center gap-3 my-6">
            <div className="flex-1 h-[2px] bg-black"></div>
            <span className="text-xs font-black text-black uppercase tracking-widest">atau</span>
            <div className="flex-1 h-[2px] bg-black"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">Nama Lengkap</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama lengkap"
                className="w-full bg-[#FAF9F5] border-[3px] border-black p-3.5 text-sm font-bold rounded-none placeholder-slate-400 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-[#FAF9F5] border-[3px] border-black p-3.5 text-sm font-bold rounded-none placeholder-slate-400 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 karakter"
                className="w-full bg-[#FAF9F5] border-[3px] border-black p-3.5 text-sm font-bold rounded-none placeholder-slate-400 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div className="bg-[#FFE066] border-[3px] border-black p-4 rounded-none text-black font-bold text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-black uppercase tracking-wider mb-1">Trial {trialDays} hari otomatis aktif</p>
              <p className="text-[11px] font-medium leading-relaxed">
                Semua fitur premium terbuka selama masa trial. Anda tidak memerlukan kartu kredit untuk mendaftar.
              </p>
            </div>

            <label className="flex items-start gap-3 text-xs font-bold text-black cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={(event) => setAcceptedLegal(event.target.checked)}
                className="mt-1 h-4 w-4 accent-black"
              />
              <span>
                Saya menyetujui{' '}
                <Link href="/legal/terms" className="underline font-black">Terms of Service</Link>
                {' '}dan{' '}
                <Link href="/legal/privacy" className="underline font-black">Privacy Policy</Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !acceptedLegal}
              className="w-full bg-[#FFE066] text-black border-[3px] border-black py-4 text-xs font-black uppercase tracking-wider flex justify-center items-center shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all rounded-none cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Mendaftar...' : 'Buat Akun & Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm font-bold text-slate-500 mt-6 uppercase tracking-wide">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-black underline font-black hover:text-neutral-700">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPasswordAction } from '../authActions';
import BrandLogo from '../../components/BrandLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const result = await forgotPasswordAction(email);
    setLoading(false);

    if (result.success) {
      setMessage('Email reset password sudah dikirim.');
    } else {
      setError(result.error || 'Gagal mengirim email reset');
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-black selection:bg-black selection:text-[#FFE066] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      
      <style>{`
        .bg-paper-dots {
          background-image: radial-gradient(rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
      `}</style>

      {/* Grid Pattern Background Layer */}
      <div className="absolute inset-0 bg-paper-dots pointer-events-none opacity-80 z-0"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="flex justify-center mb-8">
          <BrandLogo variant="horizontal" priority className="h-16 w-auto" />
        </div>

        {/* Card */}
        <div className="brutal-card p-8 bg-white border-[3px] border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black text-black uppercase tracking-wider mb-2">Reset Password</h2>
          <p className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-wide">
            Masukkan email akun Norden Anda.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border-[3px] border-black text-black font-bold text-sm rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              ❌ {error}
            </div>
          )}
          {message && (
            <div className="mb-6 p-4 bg-emerald-100 border-[3px] border-black text-black font-bold text-sm rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              ✅ {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-black uppercase text-black mb-2">Alamat Email</label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full p-3 border-[3px] border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-xs uppercase"
                placeholder="NAMA@EMAIL.COM"
              />
            </div>
            
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-[#FFE066] text-black border-[3.5px] border-black font-black uppercase text-xs sm:text-sm py-4 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-none tracking-wider cursor-pointer"
            >
              {loading ? 'Mengirim...' : 'Kirim Email Reset'}
            </button>
          </form>

          <Link href="/login" className="mt-6 block text-center text-xs font-black text-black underline uppercase tracking-wider hover:text-neutral-750">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}

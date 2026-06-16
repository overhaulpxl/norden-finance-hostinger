'use client';

import { useState } from 'react';
import { completeOnboarding } from '../actions';
import { Loader2 } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';

export default function OnboardingClient({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [fullName, setFullName] = useState(initialName);
  const [walletName, setWalletName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await completeOnboarding({
      fullName,
      walletName,
      openingBalance: parseInt(openingBalance.replace(/\D/g, ''), 10) || 0,
    });

    setLoading(false);
    if (result.success) {
      window.location.href = '/dashboard';
    } else {
      setError(result.error || 'Gagal menyelesaikan onboarding');
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
          <h2 className="text-2xl font-black text-black uppercase tracking-wider mb-1">Setup Norden</h2>
          <p className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-wide">{email}</p>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border-[3px] border-black text-black font-bold text-sm rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="onboarding-fullname" className="block text-xs font-black uppercase text-black mb-2">Nama Lengkap</label>
              <input
                id="onboarding-fullname"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full p-3 border-[3px] border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-xs uppercase"
                required
              />
            </div>
            
            <div>
              <label htmlFor="onboarding-wallet" className="block text-xs font-black uppercase text-black mb-2">Dompet / Rekening Pertama</label>
              <input
                id="onboarding-wallet"
                type="text"
                value={walletName}
                onChange={(event) => setWalletName(event.target.value)}
                className="w-full p-3 border-[3px] border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-xs uppercase"
                required
              />
            </div>

            <div>
              <label htmlFor="onboarding-balance" className="block text-xs font-black uppercase text-black mb-2">Saldo Awal</label>
              <input
                id="onboarding-balance"
                type="text"
                value={openingBalance}
                onChange={(event) => setOpeningBalance(event.target.value)}
                className="w-full p-3 border-[3px] border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-xs uppercase"
                inputMode="numeric"
                placeholder="CONTOH: 150000"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-[#FFE066] text-black border-[3.5px] border-black font-black uppercase text-xs sm:text-sm py-4 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-none tracking-wider cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin text-black" />}
              Mulai Pakai Norden
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

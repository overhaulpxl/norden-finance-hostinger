'use client';

import { useEffect, useState } from 'react';
import BrandLogo from '../components/BrandLogo';

const MESSAGES = [
  'Mengambil catatan transaksi...',
  'Menghitung saldo dompet & akun...',
  'Menganalisis ambang batas budget...',
  'Menyelaraskan target tabungan...',
  'Memproses pengingat tagihan...',
  'Mempersiapkan dashboard premium...',
];

export default function Loading() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF9F5] select-none p-4">
      <style>{`
        @keyframes progress-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes subtle-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
      `}</style>

      <div className="relative max-w-sm w-full bg-white border-[3px] border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center">
        <div
          className="w-20 h-20 flex items-center justify-center mb-6"
          style={{ animation: 'subtle-bounce 1.5s infinite ease-in-out' }}
        >
          <BrandLogo variant="icon" priority className="h-20 w-20" />
        </div>

        <BrandLogo variant="horizontal" priority className="h-12 w-auto" />

        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">
          Smart Financial Engine
        </p>

        <div className="w-full bg-[#FAF9F5] border-[3px] border-black rounded-none h-6 overflow-hidden mt-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative">
          <div
            className="absolute inset-0 bg-[#bfdbfe] border-r-[3px] border-black"
            style={{
              width: '50%',
              animation: 'progress-shimmer 1.5s infinite ease-in-out',
            }}
          />
        </div>

        <div className="flex items-center gap-2 mt-6 bg-[#FAF9F5] border-[2px] border-black px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-full justify-center">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-black text-black uppercase tracking-wider truncate">
            {MESSAGES[messageIndex]}
          </span>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Sistem Norden</span>
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">100% Aman & Terenkripsi</span>
      </div>
    </div>
  );
}

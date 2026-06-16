'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

interface WelcomeToastProps {
  userId: string;
  fullName?: string | null;
}

export default function WelcomeToast({ userId, fullName }: WelcomeToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const key = `norden_welcomed_${userId}`;
    const welcomed = localStorage.getItem(key);
    if (!welcomed) {
      // Trigger welcome message with delay to avoid cascading render lint issue
      const timer = setTimeout(() => setShow(true), 100);
      localStorage.setItem(key, 'true');
      return () => clearTimeout(timer);
    }
  }, [userId]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#fef08a] border-[3px] border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-bottom duration-300 select-none">
      <div className="flex gap-3">
        <div className="flex-shrink-0 p-1.5 bg-black border-[2px] border-black text-yellow-300 flex items-center justify-center">
          <Sparkles className="w-5 h-5 fill-yellow-300 text-yellow-300" />
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-sm font-black text-black uppercase tracking-wider">
            Selamat datang di Norden{fullName ? `, ${fullName}` : ''}!
          </p>
          <p className="text-xs font-bold text-neutral-800 uppercase tracking-wide mt-1 leading-relaxed">
            Yuk atur keuanganmu mulai hari ini.
          </p>
        </div>
        <button
          onClick={() => setShow(false)}
          className="flex-shrink-0 p-1 border-[2px] border-black bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer h-fit self-start"
        >
          <X className="w-3.5 h-3.5 text-black stroke-[3px]" />
        </button>
      </div>
    </div>
  );
}

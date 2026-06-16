'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function LandingUX() {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    // 1. Disable browser scroll restoration immediately
    if (typeof window !== 'undefined' && window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetScrollPosition = () => {
      const hash = window.location.hash;
      const allowedHashes = ['#home', '#philosophy', '#features', '#pricing', '#testimonials'];
      
      if (hash && allowedHashes.includes(hash)) {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      
      // If there is no hash or hash is not allowed, always force scroll to top
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    };

    // Run scroll reset immediately on mount
    resetScrollPosition();

    // Schedule additional checks to override asynchronous Next.js or browser hydration scroll restoration
    const rafId = requestAnimationFrame(resetScrollPosition);
    const t0 = setTimeout(resetScrollPosition, 0);
    const t1 = setTimeout(resetScrollPosition, 50);
    const t2 = setTimeout(resetScrollPosition, 100);
    const t3 = setTimeout(resetScrollPosition, 200);

    // 3. Scroll listener for sticky CTA
    const handleScroll = () => {
      // Show sticky CTA when scrolled more than 400px
      if (window.scrollY > 400) {
        setShowSticky(true);
      } else {
        setShowSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!showSticky) return null;

  // Render sticky CTA for mobile & tablet only (hidden on large screens)
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden animate-in slide-in-from-bottom duration-300 select-none">
      <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Norden Finance</p>
          <p className="text-xs font-black text-black uppercase tracking-wide truncate">
            Mulai Atur Keuangan
          </p>
        </div>
        <Link
          href="/register"
          className="bg-[#FFE066] text-black border-[2px] border-black px-4 py-2 font-black uppercase text-[10px] tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1 shrink-0"
        >
          Coba Gratis <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

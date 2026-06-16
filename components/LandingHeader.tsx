'use client';

import Link from 'next/link';
import { MouseEvent, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import BrandLogo from './BrandLogo';

type LandingHeaderProps = {
  isLoggedIn?: boolean;
};

const sectionLinks = [
  { href: '#home', label: 'Home' },
  { href: '#philosophy', label: 'Philosophy' },
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
];

export default function LandingHeader({ isLoggedIn = false }: LandingHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSectionClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    setMobileOpen(false);

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
    window.history.pushState(null, '', href);

    target.classList.add('nav-highlight');
    setTimeout(() => target.classList.remove('nav-highlight'), 1400);

    const link = event.currentTarget;
    link.classList.add('scale-click');
    setTimeout(() => link.classList.remove('scale-click'), 200);
  }

  const cta = isLoggedIn ? (
    <Link
      href="/dashboard"
      className="bg-black text-white border-[3px] border-black font-black uppercase text-xs tracking-wider px-5 py-2.5 shadow-[3px_3px_0px_0px_#FFE066] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FFE066] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all rounded-none flex items-center justify-center gap-2"
      onClick={() => setMobileOpen(false)}
    >
      Dashboard <ArrowRight className="w-4 h-4 stroke-[3px]" />
    </Link>
  ) : (
    <>
      <Link
        href="/login"
        className="font-black text-xs text-black uppercase tracking-wider hover:underline decoration-[3px] underline-offset-4 px-3 py-2 transition-all"
        onClick={() => setMobileOpen(false)}
      >
        Login
      </Link>
      <Link
        href="/register"
        className="bg-black text-white border-[3px] border-black font-black uppercase text-xs tracking-wider px-5 py-2.5 shadow-[3px_3px_0px_0px_#FFE066] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#FFE066] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all rounded-none"
        onClick={() => setMobileOpen(false)}
      >
        Mulai Sekarang
      </Link>
    </>
  );

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6 max-w-7xl mx-auto pointer-events-none select-none">
      <div className="relative bg-white/95 backdrop-blur-md border-[3px] border-black px-4 sm:px-6 py-3.5 shadow-[4px_4px_0px_0px_#000] flex items-center justify-between rounded-none pointer-events-auto">
        <Link href="#home" onClick={(event) => handleSectionClick(event, '#home')} aria-label="Norden Finance home">
          <BrandLogo variant="horizontal" priority className="h-10 sm:h-11 w-auto hover-wiggle" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 lg:gap-10 font-black text-xs text-black uppercase tracking-wider">
          {sectionLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => handleSectionClick(event, link.href)}
              className="nav-link-custom py-1 transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">{cta}</div>

        <button
          type="button"
          className="md:hidden inline-flex h-10 w-10 items-center justify-center border-[2.5px] border-black bg-[#FFE066] text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5 stroke-[3px]" /> : <Menu className="w-5 h-5 stroke-[3px]" />}
        </button>

        {mobileOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+10px)] border-[3px] border-black bg-white shadow-[4px_4px_0px_0px_#000] p-4 md:hidden">
            <nav className="flex flex-col gap-2 font-black text-xs uppercase tracking-wider">
              {sectionLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => handleSectionClick(event, link.href)}
                  className="border-[2px] border-black bg-[#FAF9F5] px-4 py-3 text-black active:bg-[#FFE066] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-3 border-t-[2px] border-black pt-4">{cta}</div>
          </div>
        )}
      </div>
    </header>
  );
}

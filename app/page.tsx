import Link from 'next/link';
import { Check, MessageSquare, Wallet, ShieldAlert, Home, Target, History, FileText, Zap, Settings, Camera, PiggyBank, CreditCard, Receipt, CalendarCheck, Flame, Trophy, Bell, LayoutTemplate, Search, Download, BarChart3, Shield } from 'lucide-react';
import { Caveat } from 'next/font/google';
import ChatSandbox from '../components/ChatSandbox';
import BackToTop from '../components/BackToTop';
import InteractiveTilt from '../components/InteractiveTilt';
import LandingUX from '../components/LandingUX';
import BrandLogo from '../components/BrandLogo';
import LandingHeader from '../components/LandingHeader';
import TestimonialsCarousel from '../components/TestimonialsCarousel';
import {
  FALLBACK_PUBLIC_TESTIMONIALS,
  LANDING_MONTHLY_PRICE,
  LANDING_TRIAL_DAYS,
  LANDING_YEARLY_PRICE,
} from '../lib/landingFallbacks';
import { formatCurrency } from '../lib/format';

export const dynamic = 'force-static';

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
});

// ==========================================
// Custom SVG Graphics & Icons
// ==========================================

function GoldCoinSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`w-14 h-14 ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="34" r="28" fill="#B58900" />
      <circle cx="32" cy="32" r="28" fill="url(#goldGradient)" stroke="#000" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="#8A6B00" strokeWidth="1.5" strokeDasharray="4 2" />
      <text x="32" y="40" fontFamily="sans-serif" fontSize="22" fontWeight="950" fill="#000" textAnchor="middle">Rp</text>
      <path d="M12 20 C18 10, 46 10, 52 20" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <defs>
        <radialGradient id="goldGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFF3A8" />
          <stop offset="40%" stopColor="#F5B041" />
          <stop offset="100%" stopColor="#D4AF37" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function ReceiptSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 64" className={`w-12 h-16 ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 8 L46 8 L46 64 L42 60 L38 64 L34 60 L30 64 L26 60 L22 64 L18 60 L14 64 L10 60 L6 64 Z" fill="rgba(0,0,0,0.15)" />
      <path d="M4 4 L44 4 L44 60 L40 56 L36 60 L32 56 L28 60 L24 56 L20 60 L16 56 L12 60 L8 56 L4 60 Z" fill="#F4F4F6" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="10" y1="14" x2="38" y2="14" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="10" y1="22" x2="30" y2="22" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="30" x2="24" y2="30" stroke="#888" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="38" x2="34" y2="38" stroke="#888" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="46" x2="38" y2="46" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  );
}

function WalletSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" className={`w-16 h-12 ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="6" width="58" height="40" rx="8" fill="rgba(0,0,0,0.15)" />
      <rect x="2" y="2" width="58" height="40" rx="8" fill="#4B6DFE" stroke="#000" strokeWidth="2.5" />
      <path d="M2 14 L46 14 C50 14 54 18 54 22 L54 34 C54 38 50 42 46 42 L2 42 Z" fill="#2E52E8" stroke="#000" strokeWidth="2.5" />
      <rect x="42" y="23" width="14" height="10" rx="2" fill="#FFE066" stroke="#000" strokeWidth="2" />
      <circle cx="46" cy="28" r="1.5" fill="#000" />
    </svg>
  );
}

// Torn Paper SVG Divider
function TornPaperDivider({ fillClass = 'fill-white', className = '' }: { fillClass?: string; className?: string }) {
  const pathD = "M0,24 L1440,24 L1440,10 L1422,13 L1405,9 L1384,14 L1363,11 L1342,15 L1323,10 L1302,13 L1285,8 L1263,12 L1241,9 L1222,14 L1204,10 L1185,13 L1161,8 L1143,11 L1125,15 L1102,9 L1083,13 L1061,10 L1043,14 L1021,8 L1004,12 L982,10 L965,13 L942,9 L924,14 L903,11 L882,15 L863,10 L842,13 L821,9 L802,12 L781,10 L764,14 L742,9 L725,13 L703,11 L682,15 L663,10 L644,12 L621,9 L603,14 L584,10 L562,13 L541,8 L524,12 L503,9 L482,14 L461,11 L442,15 L423,10 L402,13 L381,8 L364,12 L343,9 L322,14 L304,10 L281,13 L263,8 L242,11 L223,15 L204,9 L183,13 L162,10 L144,14 L121,8 L103,12 L84,9 L62,14 L41,10 L22,13 L0,8 Z";
  const strokeD = "M1440,10 L1422,13 L1405,9 L1384,14 L1363,11 L1342,15 L1323,10 L1302,13 L1285,8 L1263,12 L1241,9 L1222,14 L1204,10 L1185,13 L1161,8 L1143,11 L1125,15 L1102,9 L1083,13 L1061,10 L1043,14 L1021,8 L1004,12 L982,10 L965,13 L942,9 L924,14 L903,11 L882,15 L863,10 L842,13 L821,9 L802,12 L781,10 L764,14 L742,9 L725,13 L703,11 L682,15 L663,10 L644,12 L621,9 L603,14 L584,10 L562,13 L541,8 L524,12 L503,9 L482,14 L461,11 L442,15 L423,10 L402,13 L381,8 L364,12 L343,9 L322,14 L304,10 L281,13 L263,8 L242,11 L223,15 L204,9 L183,13 L162,10 L144,14 L121,8 L103,12 L84,9 L62,14 L41,10 L22,13 L0,8";

  return (
    <div className={`w-full overflow-hidden pointer-events-none select-none -mt-px ${className}`}>
      <svg
        viewBox="0 0 1440 24"
        className={`w-full h-6 ${fillClass} stroke-none`}
        preserveAspectRatio="none"
      >
        <path d={pathD} />
        <path d={strokeD} fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function LandingPage() {
  const trialDays = LANDING_TRIAL_DAYS;
  const monthlyPrice = LANDING_MONTHLY_PRICE;
  const yearlyPrice = LANDING_YEARLY_PRICE;
  const yearlySavingsPercent = Math.max(0, Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100));

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-black selection:bg-black selection:text-[#FFE066] font-sans antialiased relative">
      <LandingUX />
      
      {/* Custom styles for animations, active effects, grids, and marquee */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-4deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(5deg); }
        }
        .animate-float-1 { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-2 { animation: float-medium 5s ease-in-out infinite; }
        .animate-float-3 { animation: float-fast 4s ease-in-out infinite; }

        .bg-paper-dots {
          background-image: radial-gradient(rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
          background-attachment: fixed;
        }

        .brutal-btn-premium {
          position: relative;
          transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.15s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .brutal-btn-premium:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px 0px #000;
        }
        .brutal-btn-premium:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px 0px #000;
        }

        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 25s linear infinite;
        }

        /* Scroll reveal styling */
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }

        /* Hover wiggle styling */
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-1.5deg); }
          75% { transform: rotate(1.5deg); }
        }
        .hover-wiggle:hover {
          animation: wiggle 0.25s ease-in-out infinite;
        }

        /* Hover border flash styling */
        @keyframes border-flash {
          0%, 100% { border-color: #000; }
          50% { border-color: #FFE066; }
        }
        .hover-flash:hover {
          animation: border-flash 0.8s infinite;
        }

        /* Navbar click section flash */
        @keyframes section-flash-white {
          0% { background-color: #FFE066; }
          100% { background-color: #ffffff; }
        }
        @keyframes section-flash-beige {
          0% { background-color: #FFE066; }
          100% { background-color: #FAF9F5; }
        }
        
        section#features.nav-highlight {
          animation: section-flash-white 1.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        section#home.nav-highlight {
          animation: section-flash-beige 1.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        section#philosophy.nav-highlight {
          animation: section-flash-white 1.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        section#testimonials.nav-highlight {
          animation: section-flash-white 1.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        section#pricing.nav-highlight {
          animation: section-flash-beige 1.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* Link active bounce click */
        .scale-click {
          transform: scale(0.9) translateY(1px);
          color: #4B6DFE !important;
          transition: transform 0.12s ease, color 0.12s ease;
        }

        /* Custom animated underline for nav links */
        .nav-link-custom {
          position: relative;
        }
        .nav-link-custom::after {
          content: '';
          position: absolute;
          width: 100%;
          transform: scaleX(0);
          height: 3px;
          bottom: -2px;
          left: 0;
          background-color: #000;
          transform-origin: bottom right;
          transition: transform 0.22s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .nav-link-custom:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }

        /* Heartbeat logo animation */
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.18); }
          50% { transform: scale(1.05); }
          75% { transform: scale(1.18); }
        }
        .animate-heartbeat {
          animation: heartbeat 1.6s ease-in-out infinite;
        }

        /* Star Spin Interaction */
        .star-spin-hover {
          transition: transform 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .star-spin-hover:hover {
          transform: rotate(360deg);
        }

        /* Spring scale-up on pricing cards */
        .pricing-card-hover {
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15), box-shadow 0.3s ease;
        }
        .pricing-card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 12px 12px 0px 0px rgba(0,0,0,1) !important;
        }
      `}</style>

      {/* Grid Pattern Background Layer */}
      <div className="absolute inset-0 bg-paper-dots pointer-events-none opacity-80 z-0"></div>

      <div className="relative z-10">
        
        {/* Header - Floating Card Layout */}
        <LandingHeader />

        {/* Hero Section */}
        <section id="home" className="pt-20 pb-16 max-w-7xl mx-auto px-6 flex flex-col items-center text-center relative scroll-mt-32">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-black max-w-4xl leading-[1.05] mb-6 uppercase select-none reveal">
            Monitor Finansial <br />
            Tanpa Usaha.
          </h1>
          <p className="text-xs sm:text-sm font-bold text-neutral-500 max-w-2xl leading-relaxed mb-8 uppercase tracking-wide select-none reveal">
            Dashboard finansial Norden untuk mempercepat pencatatan <br className="hidden sm:inline" />
            pemasukan, pengeluaran, transfer, dan anggaran bulanan Anda.
          </p>

          <div className="mb-16 reveal">
            <Link href="/register" className="inline-block bg-[#FFE066] text-black border-[3px] border-black font-black uppercase text-xs sm:text-sm px-8 py-4 shadow-[5px_5px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all rounded-none tracking-widest hover-flash">
              MULAI SEKARANG
            </Link>
          </div>

          {/* Interactive Dashboard Mockup Sandbox */}
          <div className="w-full max-w-4xl relative mt-4 reveal">
            
            {/* Handwritten speech bubble annotation (left) */}
            <div className="absolute -left-12 sm:-left-24 top-1/4 max-w-[140px] sm:max-w-[180px] text-left transform -rotate-12 hidden md:block select-none pointer-events-none">
              <span className={`${caveat.className} text-3xl text-black block leading-none`}>
                Coba ketik atau klik di bawah!
              </span>
              <svg viewBox="0 0 100 50" className="w-20 h-10 mt-1 ml-10 stroke-black fill-none stroke-[2.5px]">
                <path d="M10,10 Q50,45 85,20" strokeDasharray="4 3" />
                <polygon points="85,20 76,17 80,25" fill="#000" stroke="#000" strokeWidth="1" />
              </svg>
            </div>

            {/* Floating Assets around the dashboard */}
            <div className="absolute -left-6 sm:-left-12 bottom-1/3 z-20 animate-float-1 hidden sm:block hover-wiggle cursor-pointer">
              <GoldCoinSVG />
            </div>
            <div className="absolute -right-6 sm:-right-10 top-1/4 z-20 animate-float-2 hidden sm:block hover-wiggle cursor-pointer">
              <GoldCoinSVG />
            </div>
            <div className="absolute -right-8 sm:-right-14 -top-8 z-20 animate-float-3 hidden sm:block hover-wiggle cursor-pointer">
              <ReceiptSVG />
            </div>
            <div className="absolute -right-12 sm:-right-16 bottom-10 z-20 animate-float-1 hidden sm:block hover-wiggle cursor-pointer">
              <WalletSVG />
            </div>

            {/* Main Dashboard Mockup Body */}
            <InteractiveTilt className="w-full relative z-10">
              <div className="brutal-card bg-white border-[3px] border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full overflow-hidden text-left aspect-[16/10] flex flex-col hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-300">
                {/* Window Topbar */}
                <div className="border-b-[3px] border-black px-4 py-3 bg-[#FAF9F5] flex justify-between items-center select-none">
                  <div className="flex items-center gap-6">
                    <span className="font-black text-xs uppercase tracking-widest text-black">NORDEN</span>
                    <span className="hidden sm:inline font-bold text-[10px] text-neutral-400 uppercase tracking-wider">Interactive Playground Demo</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-40 bg-white border-[1.5px] border-black rounded-none hidden sm:block"></div>
                    <div className="h-6 w-6 rounded-full bg-neutral-200 border-[1.5px] border-black flex items-center justify-center text-[9px] font-black">N</div>
                  </div>
                </div>

                {/* Dashboard Inner Layout */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Mock Sidebar */}
                  <div className="w-1/4 border-r-[3px] border-black bg-[#FAF9F5] p-3 hidden sm:flex flex-col justify-between select-none text-black">
                    <div className="space-y-1.5">
                      <div className="px-3 py-1.5 bg-black text-white border-[1.5px] border-black shadow-[2px_2px_0px_0px_#000] font-bold text-[9px] rounded-none cursor-pointer flex items-center gap-2">
                        <Home className="w-3.5 h-3.5 stroke-[2.5px] text-[#2ECC71]" /> Home
                      </div>
                      <div className="px-3 py-1.5 text-neutral-700 font-bold text-[9px] hover:bg-neutral-200/50 hover:text-black rounded-none cursor-pointer transition-colors flex items-center gap-2 border border-transparent">
                        <Wallet className="w-3.5 h-3.5 stroke-[2.5px] text-neutral-500" /> Wallets
                      </div>
                      <div className="px-3 py-1.5 text-neutral-700 font-bold text-[9px] hover:bg-neutral-200/50 hover:text-black rounded-none cursor-pointer transition-colors flex items-center gap-2 border border-transparent">
                        <Target className="w-3.5 h-3.5 stroke-[2.5px] text-neutral-500" /> Goals & Debts
                      </div>
                      <div className="px-3 py-1.5 text-neutral-700 font-bold text-[9px] hover:bg-neutral-200/50 hover:text-black rounded-none cursor-pointer transition-colors flex items-center gap-2 border border-transparent">
                        <History className="w-3.5 h-3.5 stroke-[2.5px] text-neutral-500" /> Transactions
                      </div>
                      
                      <div className="pt-2 pb-0.5">
                        <p className="px-3 text-[7px] font-black text-neutral-500 uppercase tracking-widest">Other</p>
                      </div>
                      
                      <div className="px-3 py-1.5 text-neutral-700 font-bold text-[9px] hover:bg-neutral-200/50 hover:text-black rounded-none cursor-pointer transition-colors flex items-center gap-2 border border-transparent">
                        <FileText className="w-3.5 h-3.5 stroke-[2.5px] text-neutral-500" /> Data Dashboard
                      </div>
                      <div className="px-3 py-1.5 text-neutral-700 font-bold text-[9px] hover:bg-neutral-200/50 hover:text-black rounded-none cursor-pointer transition-colors flex items-center gap-2 border border-transparent">
                        <Zap className="w-3.5 h-3.5 stroke-[2.5px] text-neutral-500" /> Integrations
                      </div>
                      <div className="px-3 py-1.5 text-neutral-700 font-bold text-[9px] hover:bg-neutral-200/50 hover:text-black rounded-none cursor-pointer transition-colors flex items-center gap-2 border border-transparent">
                        <Settings className="w-3.5 h-3.5 stroke-[2.5px] text-neutral-500" /> Settings
                      </div>
                    </div>

                    {/* User Profile Container matching the real Sidebar style */}
                    <div className="p-2 border-[2px] border-black rounded-none bg-white shadow-[2px_2px_0px_0px_#000] flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-none border-[1px] border-black bg-[#2ECC71] flex items-center justify-center text-black font-black text-[10px] shrink-0">
                          G
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-black text-black truncate leading-tight uppercase tracking-wider">
                            Guest User
                          </p>
                          <span className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-none border border-black inline-block mt-0.5 leading-none bg-[#FFE066] text-black">
                            Guest
                          </span>
                        </div>
                      </div>
                      <Link
                        href="/register"
                        className="w-full text-center border-[2px] border-black bg-[#2ECC71] text-black text-[8px] font-black uppercase tracking-wider py-1.5 rounded-none block hover:bg-[#27ae60] transition-colors shadow-[2px_2px_0px_0px_#000]"
                      >
                        Coba Gratis
                      </Link>
                    </div>
                  </div>

                  {/* Mock Main Panel (Chat-style sandbox) */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <ChatSandbox />
                  </div>
                </div>
              </div>
            </InteractiveTilt>
          </div>
        </section>

        {/* Philosophy Section */}
        <section id="philosophy" className="py-24 bg-white relative scroll-mt-32 border-y-[3px] border-black">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.045)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.045)_1px,transparent_1px)] bg-[size:42px_42px] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
              <div className="reveal">
                <p className="inline-flex bg-[#FFE066] border-[3px] border-black px-4 py-2 font-black text-[10px] uppercase tracking-[0.24em] shadow-[3px_3px_0px_0px_#000] mb-6">
                  Brand Philosophy
                </p>
                <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-black uppercase leading-[0.95] mb-6">
                  Kenapa Norden?
                </h2>
                <div className="space-y-4 text-sm sm:text-base font-bold leading-relaxed text-neutral-700 max-w-2xl">
                  <p>Norden Finance dibangun dari satu ide sederhana: arah.</p>
                  <p>Banyak orang tahu uangnya habis, tapi tidak selalu tahu habis ke mana atau ke mana arah finansialnya berjalan.</p>
                  <p>Nama Norden terinspirasi dari konsep utara, arah utama yang dipakai orang untuk menemukan jalan. Dalam keuangan pribadi, itu berarti kejelasan, kontrol, dan tahu ke mana uang bergerak.</p>
                  <p>Norden membantu kamu mencatat transaksi, memahami arus kas, mengelola dompet, dan membangun kebiasaan finansial yang lebih sehat.</p>
                </div>

                <div className="mt-8 bg-black text-[#FFE066] border-[3px] border-black px-5 py-4 shadow-[5px_5px_0px_0px_#FFE066] font-black uppercase tracking-widest text-xs sm:text-sm inline-block">
                  Track your money. Find your direction.
                </div>
              </div>

              <div className="reveal">
                <div className="bg-[#FFE066] border-[3px] border-black shadow-[8px_8px_0px_0px_#000] p-5 sm:p-7">
                  <div className="bg-white border-[3px] border-black p-8 sm:p-10 flex items-center justify-center min-h-[260px]">
                    <BrandLogo variant="icon" className="w-44 sm:w-56 h-auto" />
                  </div>
                  <div className="mt-6 bg-white border-[3px] border-black p-5 sm:p-6">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-black mb-4">Makna Logo</h3>
                    <div className="space-y-3 text-sm font-bold leading-relaxed text-neutral-700">
                      <p>Logo Norden menggabungkan huruf N dengan panah naik.</p>
                      <p>N mewakili Norden.</p>
                      <p>Panah naik mewakili progres, pertumbuhan, dan arah finansial yang lebih baik.</p>
                      <p>Kotak kuning membuat logo mudah dikenali.</p>
                      <p>Border hitam memberi kesan tegas, stabil, dan percaya diri.</p>
                    </div>
                    <p className="mt-5 border-t-[2px] border-black pt-4 text-xs font-black uppercase tracking-widest text-black">
                      Track your money. Find your direction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Neo-Brutalist Marquee Ticker Banner (High Engagement element to attract interest) */}
        <div className="bg-[#FFE066] border-t-[3.5px] border-b-[3.5px] border-black py-4 select-none overflow-hidden relative z-20 shadow-[0_4px_0_0_#000]">
          <div className="whitespace-nowrap flex items-center gap-16 font-black text-xs sm:text-sm uppercase tracking-widest text-black animate-marquee">
            <span>🚀 MONITOR SALDO REAL-TIME</span>
            <span>💬 CATAT TRANSAKSI LEBIH CEPAT</span>
            <span>🔒 DATA TERENKRIPSI DAN AMAN</span>
            <span>🎯 ANGGARAN BULANAN TERKENDALI</span>
            <span>⚡ COBA GRATIS SEKARANG</span>
            <span>📊 PAHAMI ARUS KAS HARIAN</span>
            <span>📄 LAPORAN BULANAN OTOMATIS</span>
            <span>🔮 PREDIKSI CASHFLOW CERDAS</span>
            <span>🎯 TARGET TABUNGAN LEBIH TERARAH</span>
            <span>💳 KONTROL PAYLATER & CICILAN</span>
            <span>🔁 PANTAU LANGGANAN RUTIN</span>
            <span>🔥 BANGUN KEBIASAAN FINANSIAL</span>
            {/* Loop duplication */}
            <span>🚀 MONITOR SALDO REAL-TIME</span>
            <span>💬 CATAT TRANSAKSI LEBIH CEPAT</span>
            <span>🔒 DATA TERENKRIPSI DAN AMAN</span>
            <span>🎯 ANGGARAN BULANAN TERKENDALI</span>
            <span>⚡ COBA GRATIS SEKARANG</span>
            <span>📊 PAHAMI ARUS KAS HARIAN</span>
            <span>📄 LAPORAN BULANAN OTOMATIS</span>
            <span>🔮 PREDIKSI CASHFLOW CERDAS</span>
            <span>🎯 TARGET TABUNGAN LEBIH TERARAH</span>
            <span>💳 KONTROL PAYLATER & CICILAN</span>
            <span>🔁 PANTAU LANGGANAN RUTIN</span>
            <span>🔥 BANGUN KEBIASAAN FINANSIAL</span>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-20 reveal">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-black uppercase">Semua Fitur Norden</h2>
              <p className="text-xs sm:text-sm font-bold text-neutral-500 uppercase tracking-wider">18+ fitur premium untuk mengelola keuangan Anda secara menyeluruh.</p>
            </div>

            {/* Hero Features - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
              
              {/* Feature 1: AI Smart Input */}
              <div className="brutal-card p-8 bg-white border-[3px] border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 relative reveal">
                <div className="absolute -top-5 left-6 bg-[#4B6DFE] text-white border-[2.5px] border-black px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] rounded-none">💬 Norden AI</div>
                <h3 className="text-xl font-black text-black uppercase tracking-wide pt-2 flex items-center gap-2"><MessageSquare className="w-5 h-5 stroke-[2.5px]" /> Smart Input</h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-bold mt-3">Ketik transaksi seperti chat biasa. Norden AI mendeteksi nominal, kategori, dompet, dan tanggal secara otomatis.</p>
                <div className="bg-[#FAF9F5] border-[2px] border-black p-3.5 mt-4 font-bold text-[10px] sm:text-xs space-y-1.5">
                  <p className="font-black border-b-[1.5px] border-black pb-1 uppercase tracking-wide">Contoh:</p>
                  <p className="flex justify-between"><span className="text-neutral-500">Pengeluaran:</span> <code className="bg-neutral-100 px-1 border border-black">&quot;kopi 35rb cash&quot;</code></p>
                  <p className="flex justify-between"><span className="text-neutral-500">Pemasukan:</span> <code className="bg-neutral-100 px-1 border border-black">&quot;gaji bca 8jt&quot;</code></p>
                </div>
              </div>

              {/* Feature 2: Receipt Scanner */}
              <div className="brutal-card p-8 bg-white border-[3px] border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 relative reveal">
                <div className="absolute -top-5 left-6 bg-[#4B6DFE] text-white border-[2.5px] border-black px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] rounded-none">📷 AI OCR</div>
                <h3 className="text-xl font-black text-black uppercase tracking-wide pt-2 flex items-center gap-2"><Camera className="w-5 h-5 stroke-[2.5px]" /> Receipt Scanner</h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-bold mt-3">Foto struk belanja, Norden AI membaca total belanja, nama toko, daftar item, dan tanggal pembelian secara otomatis.</p>
                <div className="bg-[#FAF9F5] border-[2px] border-black p-3.5 mt-4 font-bold text-[10px] sm:text-xs space-y-1">
                  <p className="font-black border-b-[1.5px] border-black pb-1 uppercase tracking-wide">Didukung:</p>
                  <p>📸 Kamera langsung atau upload galeri</p>
                  <p>🧾 Deteksi merchant, item, dan total</p>
                </div>
              </div>

              {/* Feature 3: Multi-Wallet */}
              <div className="brutal-card p-8 bg-white border-[3px] border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 relative reveal">
                <div className="absolute -top-5 right-6 bg-[#2ECC71] border-[2.5px] border-black p-1 shadow-[2.5px_2.5px_0px_0px_#000] rounded-none"><Check className="w-4 h-4 text-black stroke-[4px]" /></div>
                <h3 className="text-xl font-black text-black uppercase tracking-wide pt-2 flex items-center gap-2"><Wallet className="w-5 h-5 stroke-[2.5px]" /> Multi-Wallet</h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-bold mt-3">Pantau seluruh rekening bank, e-wallet, dan uang tunai dalam satu dashboard terpusat. Transfer antar dompet instan.</p>
                <div className="bg-[#FAF9F5] border-[2px] border-black p-3.5 mt-4 font-bold text-[10px] sm:text-xs space-y-1">
                  <p>🏦 BCA, BNI, Mandiri, dll.</p>
                  <p>📱 DANA, GoPay, OVO, ShopeePay</p>
                  <p>💵 Cash / Tunai harian</p>
                </div>
              </div>
            </div>

            {/* Full Feature Grid - 6 columns on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 reveal">
              {[
                { icon: <ShieldAlert className="w-6 h-6 stroke-[2.5px]" />, title: 'Budget', desc: 'Atur limit bulanan per kategori', color: 'bg-[#FFE066]' },
                { icon: <PiggyBank className="w-6 h-6 stroke-[2.5px]" />, title: 'Saving Goals', desc: 'Tabungan & target finansial', color: 'bg-[#2ECC71]' },
                { icon: <CreditCard className="w-6 h-6 stroke-[2.5px]" />, title: 'Debt Tracker', desc: 'Lacak utang & cicilan', color: 'bg-[#FF6B6B]' },
                { icon: <Receipt className="w-6 h-6 stroke-[2.5px]" />, title: 'Paylater', desc: 'Kelola tagihan paylater', color: 'bg-[#C084FC]' },
                { icon: <CalendarCheck className="w-6 h-6 stroke-[2.5px]" />, title: 'Subscriptions', desc: 'Monitor langganan aktif', color: 'bg-[#4B6DFE]' },
                { icon: <Flame className="w-6 h-6 stroke-[2.5px]" />, title: 'Streaks', desc: 'Raih streak harian konsisten', color: 'bg-[#F97316]' },
                { icon: <Trophy className="w-6 h-6 stroke-[2.5px]" />, title: 'Achievements', desc: 'Unlock badge pencapaian', color: 'bg-[#FFE066]' },
                { icon: <Bell className="w-6 h-6 stroke-[2.5px]" />, title: 'Reminders', desc: 'Pengingat tagihan & deadline', color: 'bg-[#2ECC71]' },
                { icon: <LayoutTemplate className="w-6 h-6 stroke-[2.5px]" />, title: 'Templates', desc: 'Template transaksi favorit', color: 'bg-[#4B6DFE]' },
                { icon: <History className="w-6 h-6 stroke-[2.5px]" />, title: 'Timeline', desc: 'Riwayat kronologis lengkap', color: 'bg-[#FF6B6B]' },
                { icon: <Search className="w-6 h-6 stroke-[2.5px]" />, title: 'Global Search', desc: 'Cari transaksi instan', color: 'bg-[#C084FC]' },
                { icon: <BarChart3 className="w-6 h-6 stroke-[2.5px]" />, title: 'Health Score', desc: 'Skor kesehatan finansial', color: 'bg-[#F97316]' },
                { icon: <FileText className="w-6 h-6 stroke-[2.5px]" />, title: 'PDF Reports', desc: 'Laporan bulanan bermerek', color: 'bg-[#FFE066]' },
                { icon: <Download className="w-6 h-6 stroke-[2.5px]" />, title: 'Export CSV/JSON', desc: 'Download data kapan saja', color: 'bg-[#2ECC71]' },
                { icon: <Shield className="w-6 h-6 stroke-[2.5px]" />, title: 'Admin Panel', desc: 'Manajemen user & payment', color: 'bg-[#4B6DFE]' },
                { icon: <Zap className="w-6 h-6 stroke-[2.5px]" />, title: 'Quick Actions', desc: 'Shortcut keyboard cepat', color: 'bg-[#FF6B6B]' },
                { icon: <Target className="w-6 h-6 stroke-[2.5px]" />, title: 'No-Spend Days', desc: 'Kalender hari tanpa belanja', color: 'bg-[#C084FC]' },
                { icon: <Settings className="w-6 h-6 stroke-[2.5px]" />, title: 'Recurring', desc: 'Transaksi otomatis bulanan', color: 'bg-[#F97316]' },
              ].map((feat, i) => (
                <div key={i} className="brutal-card p-4 bg-white border-[2.5px] border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 text-center flex flex-col items-center gap-2">
                  <div className={`${feat.color} border-[2px] border-black p-2.5 shadow-[2px_2px_0px_0px_#000] rounded-none`}>{feat.icon}</div>
                  <h4 className="font-black text-[10px] uppercase tracking-wider text-black">{feat.title}</h4>
                  <p className="text-[9px] font-bold text-neutral-500 leading-snug">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Torn paper edge from Features (white) to Next-Gen Features (beige) */}
        <TornPaperDivider fillClass="fill-[#FAF9F5]" className="bg-white" />

        {/* Next-Gen Features Section */}
        <section className="py-24 bg-[#FAF9F5] relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start mb-16">
              <div className="reveal">
                <p className="inline-flex bg-[#FFE066] border-[3px] border-black px-4 py-2 font-black text-[10px] uppercase tracking-[0.24em] shadow-[3px_3px_0px_0px_#000] mb-6">
                  Smart Finance System
                </p>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-black uppercase leading-[1.02] mb-6">
                  Fitur Cerdas untuk Arah Finansial yang Lebih Jelas
                </h2>
                <div className="space-y-4 text-sm sm:text-base font-bold leading-relaxed text-neutral-700 max-w-2xl">
                  <p>Norden membantu kamu memahami pola uang, memprediksi cashflow, menjaga budget, dan membangun kebiasaan finansial yang lebih sehat.</p>
                  <p>Norden bukan cuma mencatat pengeluaran.</p>
                  <p>Norden membantu kamu melihat pola uang, menjaga budget, memantau saldo, dan memahami arah finansialmu dengan lebih jelas.</p>
                </div>
              </div>

              <div className="reveal bg-white border-[3px] border-black p-6 sm:p-8 shadow-[7px_7px_0px_0px_#000]">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="border-[2.5px] border-black bg-[#FFE066] p-4">
                    <p className="text-3xl font-black text-black">10</p>
                    <p className="text-[10px] font-black uppercase tracking-wider text-black">Fitur lanjutan</p>
                  </div>
                  <div className="border-[2.5px] border-black bg-[#2ECC71] p-4">
                    <p className="text-3xl font-black text-black">0</p>
                    <p className="text-[10px] font-black uppercase tracking-wider text-black">Distraksi</p>
                  </div>
                </div>
                <p className="mt-5 text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed">
                  Fokusnya tetap ke uang: saldo, budget, kebiasaan, tagihan, dan arah finansial yang bisa dipahami dengan cepat.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <BarChart3 className="w-5 h-5 stroke-[2.5px]" />, badge: 'SMART', title: 'Prediksi Cashflow', desc: 'Lihat perkiraan saldo ke depan berdasarkan pengeluaran rutin, subscription, paylater, dan kebiasaan belanja harian.', color: 'bg-[#FFE066]' },
                { icon: <ShieldAlert className="w-5 h-5 stroke-[2.5px]" />, badge: 'SMART', title: 'Prediksi Budget', desc: 'Norden membantu memperkirakan apakah budget kategori tertentu berisiko habis sebelum akhir bulan.', color: 'bg-[#4B6DFE] text-white' },
                { icon: <FileText className="w-5 h-5 stroke-[2.5px]" />, badge: 'NEW', title: 'Monthly Wrapped', desc: 'Rangkuman bulanan yang menampilkan kategori terbesar, wallet teraktif, streak, dan pencapaian finansialmu.', color: 'bg-[#2ECC71]' },
                { icon: <Download className="w-5 h-5 stroke-[2.5px]" />, badge: 'NEW', title: 'Share Card', desc: 'Buat kartu visual untuk membagikan progress tabungan, streak, atau pencapaian finansial ke media sosial.', color: 'bg-[#FF6B6B]' },
                { icon: <Target className="w-5 h-5 stroke-[2.5px]" />, badge: 'SMART', title: 'Proyeksi Target Tabungan', desc: 'Lihat estimasi kapan target tabunganmu tercapai berdasarkan kebiasaan menabung saat ini.', color: 'bg-[#C084FC]' },
                { icon: <Search className="w-5 h-5 stroke-[2.5px]" />, badge: 'SMART', title: 'Analisis Kebiasaan', desc: 'Temukan pola pengeluaran seperti kategori paling sering, hari paling boros, atau pengeluaran yang mulai naik.', color: 'bg-[#FFE066]' },
                { icon: <PiggyBank className="w-5 h-5 stroke-[2.5px]" />, badge: 'PRO', title: 'Dana Darurat', desc: 'Hitung target dana darurat 3, 6, dan 12 bulan berdasarkan pengeluaran bulananmu.', color: 'bg-[#2ECC71]' },
                { icon: <Flame className="w-5 h-5 stroke-[2.5px]" />, badge: 'NEW', title: 'Misi Finansial Harian', desc: 'Bangun kebiasaan finansial lewat tantangan kecil seperti no-spend day, cek budget, atau tambah tabungan.', color: 'bg-[#F97316]' },
                { icon: <CalendarCheck className="w-5 h-5 stroke-[2.5px]" />, badge: 'SMART', title: 'Deteksi Langganan Boros', desc: 'Pantau langganan rutin dan temukan biaya bulanan yang mungkin sudah tidak terlalu dibutuhkan.', color: 'bg-[#4B6DFE] text-white' },
                { icon: <History className="w-5 h-5 stroke-[2.5px]" />, badge: 'SMART', title: 'Financial Journey', desc: 'Lihat perkembangan saldo, cashflow, dan milestone finansialmu dari waktu ke waktu.', color: 'bg-[#FFE066]' },
              ].map((feature) => (
                <div key={feature.title} className="brutal-card bg-white border-[3px] border-black p-6 min-h-[230px] shadow-[5px_5px_0px_0px_#000] hover:shadow-[7px_7px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 reveal">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className={`${feature.color} border-[2.5px] border-black p-3 shadow-[2px_2px_0px_0px_#000]`}>
                      {feature.icon}
                    </div>
                    <span className="bg-black text-[#FFE066] border-[2px] border-black px-2.5 py-1 text-[9px] font-black uppercase tracking-widest">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-black uppercase tracking-wide mb-3">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-neutral-700 font-bold leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Torn paper edge from Next-Gen Features (beige) to Testimonials (white) */}
        <TornPaperDivider fillClass="fill-white" className="bg-[#FAF9F5]" />

        {/* Testimonials Section (Builds user interest and conversion intent) */}
        <section id="testimonials" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20 reveal">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-black uppercase">Kesan Pengguna Awal</h2>
              <p className="text-xs sm:text-sm font-bold text-neutral-500 uppercase tracking-wider">Beberapa pengguna awal memakai Norden untuk mencatat transaksi harian, memantau saldo, dan melihat pola pengeluaran dengan lebih jelas.</p>
            </div>

            <div className="reveal">
              <TestimonialsCarousel testimonials={FALLBACK_PUBLIC_TESTIMONIALS} />
            </div>
          </div>
        </section>

        {/* Torn paper edge from Testimonials (white) to Pricing (beige) */}
        <TornPaperDivider fillClass="fill-[#FAF9F5]" className="bg-white" />

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-[#FAF9F5] relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 reveal">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-black uppercase">Pricing</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              
              {/* Trial Plan Card */}
              <div className="brutal-card bg-white p-8 flex flex-col justify-between border-[3px] border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] pricing-card-hover min-h-[440px] reveal">
                <div>
                  <h3 className="font-black text-xl text-black uppercase tracking-wider mb-2 text-center">⚡ TRIAL PLAN</h3>
                  <div className="text-4xl sm:text-5xl font-black text-black text-center my-3 uppercase tracking-tight">Rp 0</div>
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-wider text-center mb-5">{trialDays} Hari Gratis Akses Penuh</p>
                  
                  <ul className="space-y-2 font-bold text-[10px] text-neutral-800 pt-5 border-t-[2.5px] border-black text-left uppercase">
                    <li className="flex items-center gap-2">✓ UNLIMITED TRANSAKSI</li>
                    <li className="flex items-center gap-2">✓ UNLIMITED DOMPET</li>
                    <li className="flex items-center gap-2">✓ BUDGET PER KATEGORI</li>
                    <li className="flex items-center gap-2">✓ SUBSCRIPTION MANAGER</li>
                    <li className="flex items-center gap-2">✓ SAVING GOALS & DEBT TRACKER</li>
                    <li className="flex items-center gap-2">✓ PAYLATER TRACKER</li>
                    <li className="flex items-center gap-2">✓ FINANCIAL HEALTH SCORE</li>
                    <li className="flex items-center gap-2">✓ NO SPEND CALENDAR</li>
                    <li className="flex items-center gap-2">✓ NORDEN AI PARSER</li>
                    <li className="flex items-center gap-2">✓ NORDEN AI RECEIPT SCANNER</li>
                    <li className="flex items-center gap-2">✓ NORDEN AI INSIGHTS</li>
                    <li className="flex items-center gap-2">✓ PDF MONTHLY REPORT</li>
                    <li className="flex items-center gap-2">✓ EXPORT CSV & JSON</li>
                    <li className="flex items-center gap-2">✓ MONTHLY WRAPPED</li>
                    <li className="flex items-center gap-2">✓ SHARE CARD GENERATOR</li>
                    <li className="flex items-center gap-2">✓ BUDGET FORECAST</li>
                    <li className="flex items-center gap-2">✓ CASHFLOW FORECAST</li>
                  </ul>
                </div>

                <Link href="/register" className="block text-center bg-[#FFE066] text-black border-[3px] border-black font-black uppercase text-xs sm:text-sm py-4 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-none mt-8 tracking-wider">
                  Mulai Trial {trialDays} Hari
                </Link>
              </div>

              {/* Pro Monthly Card */}
              <div className="brutal-card bg-white p-8 flex flex-col justify-between border-[3px] border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] pricing-card-hover min-h-[440px] reveal">
                <div>
                  <h3 className="font-black text-xl text-black uppercase tracking-wider mb-2 text-center">👑 PRO PLAN</h3>
                  <div className="text-4xl sm:text-5xl font-black text-black text-center my-3 uppercase tracking-tight">
                    {formatCurrency(monthlyPrice)}<span className="text-xs sm:text-sm font-bold text-neutral-500">/bulan</span>
                  </div>
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-wider text-center mb-5">
                    {yearlyPrice
                      ? `Atau ${formatCurrency(yearlyPrice)} / tahun${yearlySavingsPercent ? ` (Hemat ${yearlySavingsPercent}%)` : ''}`
                      : 'Paket tahunan sedang dinonaktifkan'}
                  </p>
                  
                  <ul className="space-y-2 font-bold text-[10px] text-neutral-800 pt-5 border-t-[2.5px] border-black text-left uppercase">
                    <li className="flex items-center gap-2">✓ UNLIMITED TRANSAKSI</li>
                    <li className="flex items-center gap-2">✓ UNLIMITED DOMPET</li>
                    <li className="flex items-center gap-2">✓ BUDGET PER KATEGORI</li>
                    <li className="flex items-center gap-2">✓ SUBSCRIPTION MANAGER</li>
                    <li className="flex items-center gap-2">✓ SAVING GOALS & DEBT TRACKER</li>
                    <li className="flex items-center gap-2">✓ PAYLATER TRACKER</li>
                    <li className="flex items-center gap-2">✓ FINANCIAL HEALTH SCORE</li>
                    <li className="flex items-center gap-2">✓ NO SPEND CALENDAR</li>
                    <li className="flex items-center gap-2">✓ NORDEN AI PARSER</li>
                    <li className="flex items-center gap-2">✓ NORDEN AI RECEIPT SCANNER</li>
                    <li className="flex items-center gap-2">✓ NORDEN AI INSIGHTS</li>
                    <li className="flex items-center gap-2">✓ PDF MONTHLY REPORT</li>
                    <li className="flex items-center gap-2">✓ EXPORT CSV & JSON</li>
                    <li className="flex items-center gap-2">✓ MONTHLY WRAPPED</li>
                    <li className="flex items-center gap-2">✓ SHARE CARD GENERATOR</li>
                    <li className="flex items-center gap-2">✓ BUDGET FORECAST</li>
                    <li className="flex items-center gap-2">✓ CASHFLOW FORECAST</li>
                  </ul>
                </div>

                <Link href="/register?plan=monthly" className="block text-center bg-[#FFE066] text-black border-[3px] border-black font-black uppercase text-xs sm:text-sm py-4 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-none mt-8 tracking-wider">
                  Upgrade Ke Pro
                </Link>
              </div>

              {/* Pro Yearly Card */}
              <div className="brutal-card bg-white p-8 flex flex-col justify-between border-[3px] border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] pricing-card-hover min-h-[440px] relative reveal">
                {yearlySavingsPercent > 0 && (
                  <div className="absolute -top-5 right-6 bg-[#2ECC71] text-black border-[2.5px] border-black px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] rounded-none z-10">
                    HEMAT {yearlySavingsPercent}%
                  </div>
                )}
                
                <div>
                  <h3 className="font-black text-xl text-black uppercase tracking-wider mb-2 text-center">👑 PRO TAHUNAN</h3>
                  <div className="text-4xl sm:text-5xl font-black text-black text-center my-3 uppercase tracking-tight">
                    {formatCurrency(yearlyPrice)}<span className="text-xs sm:text-sm font-bold text-neutral-500">/tahun</span>
                  </div>
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-wider text-center mb-5">
                    {yearlySavingsPercent ? `Lebih hemat ${yearlySavingsPercent}% dibandingkan bulanan` : 'Paket tahunan mengikuti konfigurasi admin'}
                  </p>
                  
                  <ul className="space-y-2 font-bold text-[10px] text-neutral-800 pt-5 border-t-[2.5px] border-black text-left uppercase">
                    <li className="flex items-center gap-2">✓ UNLIMITED TRANSAKSI</li>
                    <li className="flex items-center gap-2">✓ UNLIMITED DOMPET</li>
                    <li className="flex items-center gap-2">✓ BUDGET PER KATEGORI</li>
                    <li className="flex items-center gap-2">✓ SUBSCRIPTION MANAGER</li>
                    <li className="flex items-center gap-2">✓ SAVING GOALS & DEBT TRACKER</li>
                    <li className="flex items-center gap-2">✓ PAYLATER TRACKER</li>
                    <li className="flex items-center gap-2">✓ FINANCIAL HEALTH SCORE</li>
                    <li className="flex items-center gap-2">✓ NO SPEND CALENDAR</li>
                    <li className="flex items-center gap-2">✓ NORDEN AI PARSER</li>
                    <li className="flex items-center gap-2">✓ NORDEN AI RECEIPT SCANNER</li>
                    <li className="flex items-center gap-2">✓ NORDEN AI INSIGHTS</li>
                    <li className="flex items-center gap-2">✓ PDF MONTHLY REPORT</li>
                    <li className="flex items-center gap-2">✓ EXPORT CSV & JSON</li>
                    <li className="flex items-center gap-2">✓ MONTHLY WRAPPED</li>
                    <li className="flex items-center gap-2">✓ SHARE CARD GENERATOR</li>
                    <li className="flex items-center gap-2">✓ BUDGET FORECAST</li>
                    <li className="flex items-center gap-2">✓ CASHFLOW FORECAST</li>
                  </ul>
                </div>

                <Link href="/register?plan=yearly" className="block text-center bg-[#FFE066] text-black border-[3px] border-black font-black uppercase text-xs sm:text-sm py-4 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all rounded-none mt-8 tracking-wider">
                  Upgrade Ke Pro
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* Footer Top Border merges with Pricing background */}
        <hr className="border-t-[3px] border-black" />

        {/* Footer */}
        <footer className="bg-[#FAF9F5] pt-16 pb-12 relative px-6 select-none">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-left font-bold text-xs uppercase tracking-wide">
            
            {/* Col 1 */}
            <div>
              <h5 className="font-black text-black mb-4">Norden</h5>
              <ul className="space-y-2.5 text-neutral-500">
                <li><a href="#philosophy" className="hover:text-black">Philosophy</a></li>
                <li><a href="#features" className="hover:text-black">Fitur</a></li>
                <li><a href="#testimonials" className="hover:text-black">Testimoni</a></li>
                <li><a href="#pricing" className="hover:text-black">Pricing</a></li>
                <li><Link href="/login" className="hover:text-black">Login</Link></li>
              </ul>
            </div>

            {/* Col 2 */}
            <div>
              <h5 className="font-black text-black mb-4">Legal</h5>
              <ul className="space-y-2.5 text-neutral-500">
                <li><Link href="/legal/terms" className="hover:text-black">Syarat & Ketentuan</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-black">Kebijakan Privasi</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h5 className="font-black text-black mb-4">Contact Us</h5>
              <ul className="space-y-2.5 text-neutral-500">
                <li>
                  <a 
                    href="https://wa.me/6287882924651?text=Halo%20Norden%20Finance,%20saya%20tertarik%20untuk%20bertanya%20lebih%20lanjut%20mengenai%20layanan%20Norden." 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-black flex items-center gap-2.5 group normal-case font-bold"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-neutral-500 group-hover:text-[#25D366] transition-colors shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.464L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.854 1.452 5.564 0 10.093-4.52 10.097-10.081.002-2.695-1.047-5.227-2.951-7.133C16.84 1.485 14.316.435 11.637.435c-5.568 0-10.099 4.522-10.103 10.084-.002 1.936.493 3.824 1.435 5.484L1.87 20.39l4.777-1.236zm12.333-7.247c-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
                    </svg>
                    <span className="group-hover:underline">+62 878-8292-4651</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://instagram.com/norden.finance" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-black flex items-center gap-2.5 group normal-case font-bold"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-neutral-500 group-hover:text-[#E1306C] transition-colors shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                    <span className="group-hover:underline">@norden.finance</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="flex flex-col justify-between items-start md:items-end">
              <BrandLogo variant="horizontal" className="h-10 w-auto" />
            </div>

          </div>

          {/* Footer bottom */}
          <div className="max-w-6xl mx-auto border-t-[2.5px] border-black pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-bold text-[10px] text-neutral-400 uppercase tracking-widest">
            <p>Powered by the Norden Finance</p>
            <p>© 2026 Norden Finance. All rights reserved.</p>
          </div>
        </footer>

        {/* Back to top button */}
        <BackToTop />

      </div>
    </div>
  );
}

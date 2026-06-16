import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import BrandLogo from '../../../components/BrandLogo';

export default function VerificationErrorPage() {
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
          <div className="mb-5 inline-flex border-[3px] border-black bg-red-100 p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <AlertTriangle className="h-7 w-7 stroke-[3px]" />
          </div>
          <h1 className="mb-2 text-2xl font-black uppercase tracking-wider text-black">
            Verification link expired or invalid
          </h1>
          <p className="mb-6 text-sm font-bold leading-relaxed text-slate-600">
            Please request a new verification email.
          </p>
          <Link
            href="/verify-email"
            className="block w-full border-[3px] border-black bg-[#FFE066] py-4 text-center text-xs font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000]"
          >
            Resend Verification Email
          </Link>
        </section>
      </main>
    </div>
  );
}


import Link from 'next/link';
import { getTrialDays } from '../../../lib/data/loaders';

export const dynamic = 'force-dynamic';

export default async function TermsPage() {
  const trialDays = await getTrialDays();

  return (
    <main className="min-h-screen bg-[#f3f4f6] px-4 py-12">
      <article className="mx-auto max-w-3xl brutal-card bg-white p-8">
        <h1 className="mb-4 text-3xl font-black text-black">Terms of Service</h1>
        <div className="space-y-4 text-sm font-semibold leading-7 text-slate-700">
          <p>Norden Finance adalah alat pencatatan keuangan pribadi. Informasi yang ditampilkan bukan nasihat finansial, investasi, pajak, atau hukum.</p>
          <p>Pengguna bertanggung jawab memastikan data transaksi, wallet, dan bukti pembayaran yang dimasukkan akurat.</p>
          <p>Akses Trial berlaku {trialDays} hari. Akses Pro aktif setelah pembayaran disetujui admin.</p>
          <p>Norden dapat menolak pembayaran, membatasi akses, atau menghapus data yang melanggar ketentuan, hukum, atau keamanan layanan.</p>
        </div>
        <Link href="/register" className="mt-8 inline-block font-black text-black underline">Kembali</Link>
      </article>
    </main>
  );
}

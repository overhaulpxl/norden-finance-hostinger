import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f3f4f6] px-4 py-12">
      <article className="mx-auto max-w-3xl brutal-card bg-white p-8">
        <h1 className="mb-4 text-3xl font-black text-black">Privacy Policy</h1>
        <div className="space-y-4 text-sm font-semibold leading-7 text-slate-700">
          <p>Norden Finance menyimpan data profil, wallet, transaksi, budget, target, utang, pembayaran, dan aktivitas akun untuk menyediakan layanan personal finance tracker.</p>
          <p>Data pengguna dipisahkan berdasarkan Firebase UID dan hanya digunakan untuk menjalankan fitur aplikasi, proses pembayaran, audit keamanan, dan dukungan pelanggan.</p>
          <p>Bukti pembayaran dan gambar struk dapat diproses oleh penyimpanan aplikasi dan layanan AI OCR sesuai konfigurasi aplikasi.</p>
          <p>Pengguna dapat menghapus data akun dari halaman Settings. Penghapusan bersifat permanen untuk data aplikasi.</p>
        </div>
        <Link href="/register" className="mt-8 inline-block font-black text-black underline">Kembali</Link>
      </article>
    </main>
  );
}

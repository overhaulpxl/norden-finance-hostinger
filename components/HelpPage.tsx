'use client';

import React, { useState } from 'react';
import {
  Bell,
  BookOpen,
  Camera,
  ChevronDown,
  Loader2,
  Send,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Wallet,
} from 'lucide-react';
import { submitFeedback } from '../app/actions';

type HelpTopic = {
  title: string;
  summary: string;
  steps: string[];
  example?: string;
  tip?: string;
  troubleshooting?: string;
};

type HelpCategory = {
  title: string;
  description: string;
  icon: React.ReactNode;
  topics: HelpTopic[];
};

const helpCategories: HelpCategory[] = [
  {
    title: 'Memulai dengan Norden',
    description: 'Dasar penggunaan akun, verifikasi, wallet pertama, dan transaksi pertama.',
    icon: <BookOpen className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'Cara membuat akun',
        summary: 'Buat akun dari halaman Login atau Mulai Sekarang, lalu masuk dengan email yang aktif.',
        steps: ['Buka halaman login.', 'Pilih daftar akun baru.', 'Isi nama, email, dan password.', 'Selesaikan verifikasi jika diminta.'],
        tip: 'Gunakan email yang sering Anda cek karena notifikasi billing dan verifikasi akan dikirim ke sana.',
      },
      {
        title: 'Cara verifikasi email',
        summary: 'Verifikasi email membantu menjaga akun tetap aman dan siap dipakai lintas perangkat.',
        steps: ['Cek inbox email setelah registrasi.', 'Buka email dari Norden.', 'Klik tombol verifikasi.', 'Kembali ke Norden dan login ulang jika sesi belum aktif.'],
        troubleshooting: 'Jika email belum masuk, cek folder spam atau gunakan tombol kirim ulang verifikasi di halaman login.',
      },
      {
        title: 'Cara membuat wallet pertama',
        summary: 'Wallet adalah tempat saldo Anda disimpan, seperti Cash, BCA, BNI, Dana, atau GoPay.',
        steps: ['Masuk ke dashboard.', 'Buka menu Wallets.', 'Klik tambah wallet.', 'Isi nama wallet dan saldo awal.', 'Simpan wallet.'],
        example: 'Contoh: wallet BCA dengan saldo awal Rp 1.500.000.',
      },
      {
        title: 'Cara mencatat transaksi pertama',
        summary: 'Transaksi bisa dicatat cepat lewat Smart Input atau form manual.',
        steps: ['Klik tombol New Transaction.', 'Ketik transaksi dengan bahasa natural.', 'Pastikan wallet sudah disebut atau tersedia.', 'Kirim dan cek riwayat transaksi.'],
        example: 'Contoh Smart Input: "25 ribu kopi cash".',
      },
    ],
  },
  {
    title: 'Pencatatan Transaksi',
    description: 'Panduan Smart Input, input manual, transfer antar wallet, dan update saldo.',
    icon: <Sparkles className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'Cara pakai Smart Input',
        summary: 'Smart Input membaca nominal, kategori, catatan, tanggal, dan wallet dari satu kalimat.',
        steps: ['Klik New Transaction.', 'Tulis nominal dan konteks transaksi.', 'Sebut wallet jika ingin spesifik.', 'Kirim input dan cek hasil parsing.'],
        example: 'Contoh: "makan siang 45 ribu bca kemarin".',
        tip: 'Semakin jelas wallet dan nominalnya, semakin rapi hasil catatan.',
      },
      {
        title: 'Cara input manual',
        summary: 'Gunakan input manual saat Anda ingin mengatur kategori, tanggal, wallet, atau catatan secara presisi.',
        steps: ['Buka form transaksi manual.', 'Pilih tipe transaksi.', 'Isi nominal, kategori, wallet, dan tanggal.', 'Simpan transaksi.'],
      },
      {
        title: 'Cara transfer antar wallet',
        summary: 'Transfer memindahkan saldo dari satu wallet ke wallet lain tanpa dihitung sebagai pengeluaran biasa.',
        steps: ['Buat transaksi transfer.', 'Pilih wallet asal.', 'Pilih wallet tujuan.', 'Isi nominal dan simpan.'],
        example: 'Contoh Smart Input: "transfer 500 ribu dari bca ke dana".',
      },
      {
        title: 'Cara update saldo',
        summary: 'Update saldo dipakai saat saldo real di rekening berbeda dari catatan Norden.',
        steps: ['Buka Wallets atau gunakan Smart Input.', 'Pilih wallet yang ingin disesuaikan.', 'Masukkan saldo real terbaru.', 'Simpan perubahan.'],
        example: 'Contoh Smart Input: "saldo bca 2 juta".',
        troubleshooting: 'Saldo bisa berubah karena transaksi baru, transfer, update saldo manual, atau transaksi yang dihapus.',
      },
    ],
  },
  {
    title: 'Wallet & Saldo',
    description: 'Kelola wallet, edit saldo, arsipkan wallet, dan pahami perubahan saldo.',
    icon: <Wallet className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'Cara membuat wallet',
        summary: 'Buat wallet untuk setiap tempat uang yang ingin dipantau.',
        steps: ['Buka menu Wallets.', 'Klik tambah wallet.', 'Isi nama, tipe, dan saldo awal.', 'Simpan.'],
        tip: 'Pisahkan wallet penting seperti Cash, rekening utama, e-wallet, dan tabungan.',
      },
      {
        title: 'Cara edit saldo',
        summary: 'Edit saldo jika Anda ingin menyamakan catatan Norden dengan saldo real.',
        steps: ['Pilih wallet.', 'Klik edit atau update saldo.', 'Masukkan saldo terbaru.', 'Simpan perubahan.'],
      },
      {
        title: 'Cara arsipkan wallet',
        summary: 'Arsipkan wallet yang tidak dipakai tanpa menghapus histori transaksi lama.',
        steps: ['Buka daftar wallet.', 'Pilih wallet yang tidak aktif.', 'Klik arsipkan.', 'Wallet disembunyikan dari pilihan utama.'],
        tip: 'Arsip cocok untuk rekening lama, e-wallet tidak aktif, atau wallet sementara.',
      },
      {
        title: 'Kenapa saldo bisa berubah',
        summary: 'Saldo mengikuti transaksi masuk, transaksi keluar, transfer, update saldo, dan penghapusan transaksi.',
        steps: ['Cek transaksi terbaru.', 'Cek apakah ada transfer antar wallet.', 'Cek apakah saldo pernah di-update manual.', 'Cek riwayat penghapusan jika tersedia.'],
      },
    ],
  },
  {
    title: 'Budget & Goals',
    description: 'Atur batas pengeluaran, target tabungan, dan proyeksi pencapaian.',
    icon: <Shield className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'Cara membuat budget',
        summary: 'Budget membantu membatasi pengeluaran kategori tertentu dalam satu bulan.',
        steps: ['Buka Goals & Debts atau area Budget.', 'Pilih kategori.', 'Isi limit bulanan.', 'Simpan budget.'],
        example: 'Contoh: Makanan Rp 1.500.000 per bulan.',
      },
      {
        title: 'Cara membaca progress budget',
        summary: 'Progress menunjukkan seberapa banyak limit yang sudah terpakai.',
        steps: ['Lihat persentase budget.', 'Bandingkan sisa budget dengan sisa hari bulan ini.', 'Kurangi pengeluaran jika kategori mendekati limit.'],
        tip: 'Jika progress naik terlalu cepat di awal bulan, kategori itu berisiko habis sebelum akhir bulan.',
      },
      {
        title: 'Cara membuat target tabungan',
        summary: 'Target tabungan membantu melacak dana yang ingin dicapai.',
        steps: ['Buka Goals.', 'Klik tambah target.', 'Isi nama target, nominal, dan deadline jika ada.', 'Update progress saat Anda menabung.'],
      },
      {
        title: 'Cara membaca proyeksi target',
        summary: 'Proyeksi membantu memperkirakan kapan target tercapai berdasarkan progress saat ini.',
        steps: ['Buka detail target.', 'Lihat progress dan estimasi.', 'Tambah nominal rutin agar target lebih cepat tercapai.'],
        troubleshooting: 'Jika belum ada progress tabungan, proyeksi bisa belum terlihat jelas.',
      },
    ],
  },
  {
    title: 'Reports & Wrapped',
    description: 'Download laporan, baca Monthly Wrapped, dan buat Share Card.',
    icon: <Camera className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'Cara download PDF report',
        summary: 'PDF report merangkum transaksi, kategori, wallet, dan insight bulanan.',
        steps: ['Buka Data Dashboard.', 'Pilih Reports.', 'Klik PDF Report.', 'Simpan file ke perangkat Anda.'],
        tip: 'Gunakan laporan ini untuk review bulanan atau arsip keuangan pribadi.',
      },
      {
        title: 'Cara membaca Monthly Wrapped',
        summary: 'Monthly Wrapped menampilkan ringkasan visual dari bulan berjalan atau bulan terpilih.',
        steps: ['Buka Data Dashboard.', 'Lihat kartu Monthly Wrapped.', 'Cek kategori terbesar, wallet aktif, cashflow, dan insight.', 'Gunakan hasilnya untuk evaluasi bulan depan.'],
      },
      {
        title: 'Cara membuat Share Card',
        summary: 'Share Card membuat kartu visual dari progress, streak, atau pencapaian finansial.',
        steps: ['Buka area Wrapped atau Share Card.', 'Pilih data yang ingin ditampilkan.', 'Generate kartu.', 'Download gambar dan bagikan jika Anda ingin.'],
        troubleshooting: 'Jika data kosong, Norden akan menampilkan empty state, bukan angka palsu.',
      },
    ],
  },
  {
    title: 'Pro Features',
    description: 'Fitur Pro untuk analisis, laporan, dan prediksi yang lebih lengkap.',
    icon: <Trophy className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'Receipt Scanner',
        summary: 'Receipt Scanner membantu membaca struk dan mengubahnya menjadi catatan transaksi.',
        steps: ['Buka fitur scanner.', 'Upload foto struk yang jelas.', 'Cek hasil pembacaan.', 'Simpan transaksi jika datanya sudah sesuai.'],
      },
      {
        title: 'Cashflow Forecast',
        summary: 'Cashflow Forecast memperkirakan arah saldo berdasarkan transaksi rutin dan kebiasaan belanja.',
        steps: ['Buka Data Dashboard.', 'Lihat proyeksi cashflow.', 'Bandingkan estimasi dengan rencana pengeluaran.', 'Sesuaikan budget jika saldo berisiko turun.'],
      },
      {
        title: 'Budget Forecast',
        summary: 'Budget Forecast memperkirakan kategori yang mungkin habis sebelum akhir bulan.',
        steps: ['Buka budget aktif.', 'Lihat kategori berisiko.', 'Kurangi transaksi di kategori tersebut atau naikkan limit jika memang perlu.'],
      },
      {
        title: 'Money Habits Analysis',
        summary: 'Analisis kebiasaan membantu menemukan pola seperti hari paling boros dan kategori yang mulai naik.',
        steps: ['Buka Reports.', 'Cek bagian kebiasaan.', 'Lihat pola pengeluaran.', 'Pilih satu kebiasaan kecil untuk diperbaiki minggu ini.'],
      },
      {
        title: 'Monthly PDF Report',
        summary: 'Laporan PDF bulanan memberi arsip rapi untuk review finansial.',
        steps: ['Buka Reports.', 'Klik PDF Report.', 'Download file.', 'Bandingkan laporan bulan ini dengan bulan sebelumnya.'],
      },
    ],
  },
  {
    title: 'Billing & Upgrade',
    description: 'Upgrade Pro, upload bukti pembayaran, dan proses approval admin.',
    icon: <Bell className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'Cara upgrade Pro',
        summary: 'Upgrade Pro dilakukan dari halaman Upgrade atau Settings.',
        steps: ['Buka Upgrade atau Settings.', 'Pilih paket bulanan atau tahunan.', 'Ikuti instruksi pembayaran yang tersedia.', 'Upload bukti pembayaran.'],
      },
      {
        title: 'Cara upload bukti pembayaran',
        summary: 'Bukti pembayaran dipakai admin untuk memverifikasi status langganan.',
        steps: ['Selesaikan pembayaran.', 'Upload bukti pembayaran di halaman Upgrade.', 'Pastikan file jelas.', 'Kirim request.'],
      },
      {
        title: 'Cara admin approval bekerja',
        summary: 'Admin mengecek bukti pembayaran sebelum plan berubah menjadi Pro.',
        steps: ['Request masuk sebagai pending.', 'Admin memeriksa nominal dan bukti.', 'Admin menyetujui atau menolak request.', 'Status akun diperbarui setelah approval.'],
      },
      {
        title: 'Apa yang terjadi setelah payment approved',
        summary: 'Setelah disetujui, fitur Pro aktif sesuai paket yang dibeli.',
        steps: ['Refresh dashboard.', 'Cek status plan di Settings.', 'Gunakan fitur Pro.', 'Hubungi support jika status belum berubah.'],
        troubleshooting: 'Jika pembayaran ditolak, cek catatan admin lalu upload ulang bukti yang benar.',
      },
    ],
  },
];

function TopicAccordion({
  topic,
  isOpen,
  onToggle,
}: {
  topic: HelpTopic;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-[2px] border-black bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-[#fff7bf]"
        aria-expanded={isOpen}
      >
        <div>
          <p className="text-sm font-black text-black">{topic.title}</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-neutral-600">{topic.summary}</p>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="border-t-[2px] border-black bg-[#FAF9F5] p-4">
          <ol className="space-y-3">
            {topic.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm font-semibold leading-relaxed text-neutral-700">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-[2px] border-black bg-black text-[11px] font-black text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {(topic.example || topic.tip || topic.troubleshooting) && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {topic.example && (
                <div className="border-[2px] border-black bg-white p-3">
                  <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-black">Contoh</p>
                  <p className="text-sm font-semibold leading-relaxed text-neutral-700">{topic.example}</p>
                </div>
              )}
              {topic.tip && (
                <div className="border-[2px] border-black bg-[#bbf7d0] p-3">
                  <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-black">Tips</p>
                  <p className="text-sm font-semibold leading-relaxed text-emerald-950">{topic.tip}</p>
                </div>
              )}
              {topic.troubleshooting && (
                <div className="border-[2px] border-black bg-red-100 p-3">
                  <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-black">Troubleshooting</p>
                  <p className="text-sm font-semibold leading-relaxed text-red-950">{topic.troubleshooting}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [openTopic, setOpenTopic] = useState('Memulai dengan Norden-Cara membuat akun');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) {
      setError('Ulasan atau umpan balik wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await submitFeedback({ rating, message });
      if (response.success) {
        setSuccess(true);
        setMessage('');
        setRating(5);
      } else {
        setError(response.error || 'Gagal mengirimkan ulasan.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl select-none space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="mb-2 text-2xl font-black uppercase tracking-wider text-black">Pusat Bantuan Norden</h2>
        <p className="max-w-2xl text-sm font-bold leading-relaxed text-neutral-600">
          Tutorial singkat untuk mencatat transaksi, mengatur wallet, membaca laporan, dan mengelola billing tanpa bahasa teknis.
        </p>
      </div>

      <div className="space-y-5">
        {helpCategories.map((category) => (
          <section key={category.title} className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:p-5">
            <div className="mb-4 flex items-start gap-4 border-b-[3px] border-black pb-4">
              <div className="border-[2px] border-black bg-[#FFE066] p-2.5 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {category.icon}
              </div>
              <div>
                <h3 className="text-base font-black text-black">{category.title}</h3>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-neutral-600">{category.description}</p>
              </div>
            </div>
            <div className="space-y-3">
              {category.topics.map((topic) => {
                const key = `${category.title}-${topic.title}`;
                return (
                  <TopicAccordion
                    key={key}
                    topic={topic}
                    isOpen={openTopic === key}
                    onToggle={() => setOpenTopic((current) => (current === key ? '' : key))}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="border-[3px] border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="mb-6 flex items-center gap-4 border-b-[3px] border-black pb-4">
          <div className="border-[2px] border-black bg-[#FFE066] p-2.5 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Star className="h-5 w-5 fill-yellow-400 stroke-[2.5px] text-yellow-600" />
          </div>
          <h3 className="text-base font-black uppercase tracking-wider text-black">Kirim Umpan Balik & Ulasan</h3>
        </div>

        {success && (
          <div className="mb-6 border-[2px] border-black bg-emerald-100 p-4 text-sm font-bold text-emerald-900">
            Terima kasih. Ulasan Anda berhasil dikirim dan akan diproses oleh tim admin kami.
          </div>
        )}

        {error && (
          <div className="mb-6 border-[2px] border-black bg-red-100 p-4 text-sm font-bold text-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-black">Beri Rating Norden Finance</label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="border-[2px] border-black bg-white p-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-neutral-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  aria-label={`Beri rating ${star}`}
                >
                  <Star
                    className={`h-6 w-6 stroke-[2px] transition-all ${
                      star <= rating ? 'fill-yellow-400 text-yellow-600' : 'text-neutral-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="feedback-message" className="mb-2 block text-xs font-black uppercase tracking-wider text-black">Tulis Masukan atau Testimoni Anda</label>
            <textarea
              id="feedback-message"
              rows={4}
              placeholder="Contoh: Norden membantu saya mencatat transaksi harian lebih cepat dan melihat pola pengeluaran lebih jelas."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full border-[3px] border-black p-4 text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-neutral-500 focus:translate-x-[1px] focus:translate-y-[1px] focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 border-[3px] border-black bg-[#bbf7d0] px-5 py-3 text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-[#a7f3d0] disabled:cursor-not-allowed disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-black" /> Mengirim...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 text-black" /> Kirim Umpan Balik
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

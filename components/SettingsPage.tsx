import { useState } from 'react';
import { User, Crown, Check, Zap, Database, Trash2, Key } from 'lucide-react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { deleteUserAccountData } from '../app/actions';
import Link from 'next/link';
import { MVP_FEATURES } from '../lib/constants';
import { formatCurrency } from '../lib/format';

interface SettingsProps {
  user: {
    id: string;
    email: string;
    plan: 'trial' | 'pro';
    fullName?: string;
    trialEndsAt?: string | null;
  };
  stats: {
    transactionCount: number;
    walletCount: number;
    balanceTotal: number;
  };
  trialDays: number;
  pricingPlans: {
    monthly: { price: number; name: string } | null;
    yearly: { price: number; name: string } | null;
  };
}

export default function SettingsPage({ user, stats, trialDays, pricingPlans }: SettingsProps) {
  const isPro = user.plan === 'pro';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [now] = useState(() => Date.now());
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const monthlyPrice = pricingPlans.monthly?.price ?? null;
  const yearlyPrice = pricingPlans.yearly?.price ?? null;
  const yearlySavingsPercent = monthlyPrice && yearlyPrice
    ? Math.max(0, Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100))
    : null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Pengguna tidak terdeteksi. Silakan login kembali.');
      }
      await updatePassword(currentUser, newPassword);
      setSuccess('Password berhasil diperbarui!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      console.error(err);
      if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'auth/requires-recent-login') {
        setError('Sesi Anda sudah lama aktif. Harap keluar akun dan login kembali untuk memperbarui password.');
      } else {
        setError(err instanceof Error ? err.message : 'Gagal memperbarui password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Ketik DELETE untuk menghapus akun.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Pengguna tidak terdeteksi. Silakan login kembali.');
      }

      const usesPassword = currentUser.providerData.some((provider) => provider.providerId === 'password');
      if (usesPassword) {
        if (!deletePassword) throw new Error('Password wajib diisi untuk menghapus akun.');
        const credential = EmailAuthProvider.credential(currentUser.email || user.email, deletePassword);
        await reauthenticateWithCredential(currentUser, credential);
      }

      const res = await deleteUserAccountData();
      if (!res.success) {
        throw new Error(res.error || 'Gagal menghapus data dari database.');
      }

      await deleteUser(currentUser);

      window.location.href = '/login';
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus akun.');
      setLoading(false);
    }
  };

  const allFeatures = MVP_FEATURES;

  // Calculate trial days remaining
  const trialDaysLeft = user.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24)))
    : null;

  const levelInfo = (() => {
    const txCount = stats.transactionCount;
    if (txCount >= 100) return { level: 5, name: 'Financial Navigator', color: 'bg-[#c084fc]' };
    if (txCount >= 50) return { level: 4, name: 'Budget Master', color: 'bg-[#4ade80]' };
    if (txCount >= 20) return { level: 3, name: 'Smart Planner', color: 'bg-[#facc15]' };
    if (txCount >= 5) return { level: 2, name: 'Consistent Tracker', color: 'bg-[#60a5fa]' };
    return { level: 1, name: 'Beginner Saver', color: 'bg-[#a3a3a3]' };
  })();

  return (
    <div className="space-y-8 max-w-3xl select-none">
      {/* Profile Card */}
      <div className="brutal-card p-6 bg-white">
        <div className="flex justify-between items-start mb-6 border-b-[3px] border-black pb-4">
          <h3 className="text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
            <User className="w-5 h-5 text-black stroke-[3px]" /> Profil Akun
          </h3>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-white border-[3px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-14 h-14 rounded-none border-[3px] border-black bg-black flex items-center justify-center text-white font-black text-xl flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-black text-black uppercase tracking-wider">{user.fullName || 'User'}</p>
              <p className="text-sm text-neutral-500 font-bold uppercase tracking-wider">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-none border-[2px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                  isPro ? 'bg-[#bbf7d0] text-black' : 'bg-[#fef08a] text-black'
                }`}>
                  {isPro ? 'Pro Plan 👑' : `Trial ⚡${trialDaysLeft !== null ? ` — ${trialDaysLeft} hari` : ''}`}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-none border-[2px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${levelInfo.color} text-black`}>
                  Lvl {levelInfo.level}: {levelInfo.name}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border-[2px] border-black text-center rounded-none bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-2xl font-black text-black tracking-wider">{stats.transactionCount}</p>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">Transaksi</p>
            </div>
            <div className="p-4 border-[2px] border-black text-center rounded-none bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-2xl font-black text-black tracking-wider">{stats.walletCount}</p>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">Dompet</p>
            </div>
            <div className="p-4 border-[2px] border-black text-center rounded-none bg-[#f3f4f6] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-2xl font-black text-black">∞</p>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">Limit/Bulan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Keamanan & Ganti Password */}
      <div className="brutal-card p-6 bg-white">
        <div className="flex justify-between items-start mb-6 border-b-[3px] border-black pb-4">
          <h3 className="text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
            <Key className="w-5 h-5 text-black stroke-[3px]" /> Keamanan & Ganti Password
          </h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          {error && (
            <div className="p-3 bg-red-100 border-[2px] border-black text-red-700 font-bold text-xs uppercase tracking-wider">
              ❌ {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-100 border-[2px] border-black text-emerald-800 font-bold text-xs uppercase tracking-wider">
              ✅ {success}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-black">Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2.5 border-[3px] border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-sm"
              placeholder="MINIMAL 6 KARAKTER"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-black">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2.5 border-[3px] border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-sm"
              placeholder="ULANGI PASSWORD BARU"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 brutal-btn font-black text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'MEMPROSES...' : 'PERBARUI PASSWORD'}
          </button>
        </form>
      </div>

      {/* Plan Info */}
      <div className="brutal-card p-6 bg-white">
        <div className="flex justify-between items-start mb-6 border-b-[3px] border-black pb-4">
          <h3 className="text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
            <Crown className="w-5 h-5 text-black stroke-[3px]" /> Paket Langganan
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Trial / Current */}
          <div className={`p-6 border-[3px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
            !isPro ? 'bg-[#fef08a]' : 'bg-white'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-black stroke-[3px]" />
              <h4 className="text-base font-black text-black uppercase tracking-wider">Trial Plan</h4>
            </div>
            <p className="text-3xl font-black text-black mb-1 tracking-wider">Rp 0</p>
            <p className="text-xs font-bold text-neutral-600 mb-4 uppercase tracking-wider">{trialDays} hari gratis akses penuh</p>
            <ul className="space-y-2">
              {allFeatures.slice(0, 6).map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-bold text-black uppercase tracking-wider">
                  <Check className="w-4 h-4 text-emerald-800 stroke-[3px] flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {!isPro && (
              <div className="mt-6 p-2 bg-white text-black text-center text-xs font-black uppercase tracking-widest rounded-none border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                ✓ Paket Aktif
              </div>
            )}
          </div>

          {/* Pro Plan */}
          <div className={`p-6 border-[3px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
            isPro ? 'bg-[#bbf7d0]' : 'bg-white'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-black stroke-[3px]" />
              <h4 className="text-base font-black text-black uppercase tracking-wider">Pro Plan</h4>
            </div>
            <p className="text-3xl font-black text-black mb-1 tracking-wider">
              {monthlyPrice !== null ? formatCurrency(monthlyPrice) : 'Tidak tersedia'}
            </p>
            <p className="text-xs font-bold text-neutral-600 mb-4 uppercase tracking-wider">
              {yearlyPrice
                ? `atau ${formatCurrency(yearlyPrice)} / tahun${yearlySavingsPercent ? ` (hemat ${yearlySavingsPercent}%)` : ''}`
                : 'Paket tahunan sedang dinonaktifkan'}
            </p>
            <ul className="space-y-2">
              {allFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-bold text-black uppercase tracking-wider">
                  <Check className="w-4 h-4 text-emerald-800 stroke-[3px] flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <div className="mt-6 p-2 bg-white text-black text-center text-xs font-black uppercase tracking-widest rounded-none border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                ✓ Paket Aktif
              </div>
            ) : (
              <Link href="/upgrade" className="block mt-6 w-full brutal-btn py-3 text-xs font-black uppercase tracking-widest text-center cursor-pointer">
                Upgrade ke Pro
              </Link>
            )}
          </div>
        </div>
      </div>



      {/* Data & Storage */}
      <div className="brutal-card p-6 bg-white">
        <div className="flex justify-between items-start mb-6 border-b-[3px] border-black pb-4">
          <h3 className="text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
            <Database className="w-5 h-5 text-black stroke-[3px]" /> Data & Penyimpanan
          </h3>
        </div>
        <p className="text-sm text-neutral-600 font-bold mb-4 uppercase tracking-wide">
          Semua data keuangan Anda disimpan secara aman menggunakan Firebase Auth dan database aplikasi.
          Data diamankan menggunakan otentikasi Firebase dan otorisasi Prisma.
        </p>
        <div className="p-4 bg-white border-[3px] border-red-650 rounded-none shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-red-650 flex-shrink-0 mt-0.5 stroke-[2.5px]" />
            <div>
              <h4 className="text-sm font-black text-red-650 uppercase tracking-wider">Zona Bahaya</h4>
              <p className="text-xs text-neutral-600 font-bold mt-1 uppercase tracking-wider">
                Menghapus akun akan menghilangkan semua transaksi, saldo, target tabungan, dan data lainnya secara permanen. Ketik DELETE dan masukkan password untuk konfirmasi.
              </p>
              <div className="mt-3 grid gap-2">
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full max-w-sm brutal-input text-xs font-black uppercase"
                  placeholder="KETIK DELETE"
                />
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full max-w-sm brutal-input text-xs font-bold"
                  placeholder="PASSWORD AKUN"
                />
              </div>
              <button 
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirmText !== 'DELETE'}
                className="mt-3 px-4 py-2 border-[2px] border-black bg-white text-red-650 rounded-none text-xs font-black hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {loading ? 'MENGHAPUS...' : 'Hapus Akun Saya'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

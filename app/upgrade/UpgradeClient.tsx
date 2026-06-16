'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useRef } from 'react';
import { ArrowLeft, Check, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { submitPaymentRequest } from '../actions/payments';
import { MVP_FEATURES } from '../../lib/constants';
import { formatCurrency } from '../../lib/format';

interface UpgradeClientProps {
  profile: {
    userId: string;
    fullName?: string | null;
    plan: 'trial' | 'pro';
  };
  initialRequests: PaymentRequestView[];
  paymentSettings: {
    bca_number: string;
    bca_holder: string;
    bca_active: string;
    bni_number: string;
    bni_holder: string;
    bni_active: string;
    qris_image: string;
    qris_active: string;
  };
  pricingPlans: {
    monthly: PricingPlanView | null;
    yearly: PricingPlanView | null;
  };
  initialPlan?: 'monthly' | 'yearly';
}

interface PricingPlanView {
  id: string;
  name: string;
  price: number;
  billingType: string | null;
  durationDays?: number | null;
  isActive: boolean;
}

interface PaymentRequestView {
  id: string;
  plan?: string;
  billingType: string;
  amount: number;
  paymentMethod: string;
  proofPath: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

export default function UpgradeClient({ profile, initialRequests, paymentSettings, pricingPlans, initialPlan }: UpgradeClientProps) {
  const availableMethods: Array<'qris' | 'bca' | 'bni'> = [];
  if (paymentSettings.qris_active !== 'false') availableMethods.push('qris');
  if (paymentSettings.bca_active !== 'false') availableMethods.push('bca');
  if (paymentSettings.bni_active !== 'false') availableMethods.push('bni');
  const paymentConfigured = availableMethods.length > 0;

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(initialPlan || 'monthly');
  const [paymentMethod, setPaymentMethod] = useState<'bca' | 'bni' | 'qris'>(availableMethods[0] || 'qris');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [requests, setRequests] = useState(initialRequests);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPro = profile.plan === 'pro';
  const hasSelectedPlan = Boolean(pricingPlans[selectedPlan]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal adalah 5MB.');
        return;
      }
      if (!selectedFile.type.startsWith('image/')) {
        setError('Bukti pembayaran harus berupa gambar.');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Silakan unggah bukti transfer terlebih dahulu.');
      return;
    }
    if (!paymentConfigured) {
      setError('Metode pembayaran belum dikonfigurasi admin.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await fetch('/api/upload/payment-proof', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadData.proofPath) {
        throw new Error(uploadData.error || 'Gagal mengunggah bukti pembayaran.');
      }
      const proofPathValue = uploadData.proofPath as string;

      // 3. Submit Payment Request
      const selectedPricing = pricingPlans[selectedPlan];
      if (!selectedPricing) {
        throw new Error('Paket harga sedang tidak tersedia.');
      }
      const amount = selectedPricing.price;
      const res = await submitPaymentRequest({
        billingType: selectedPlan,
        amount,
        paymentMethod,
        proofPath: proofPathValue,
      });

      if (res.success) {
        setSuccess('Bukti transfer berhasil dikirim! Silakan tunggu persetujuan admin.');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Add new pending request locally to history
        const newRequest = {
          id: Math.random().toString(),
          plan: 'pro',
          billingType: selectedPlan,
          amount,
          paymentMethod,
          proofPath: proofPathValue,
          status: 'pending',
          adminNote: null,
          createdAt: new Date().toISOString(),
        };
        setRequests([newRequest, ...requests]);
      } else {
        setError(res.error || 'Gagal mengirim pembayaran.');
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const planFeatures = [
    ...MVP_FEATURES,
    'Prioritas bantuan pelanggan',
  ];
  const monthlyPrice = pricingPlans.monthly?.price ?? null;
  const yearlyPrice = pricingPlans.yearly?.price ?? null;
  const yearlySavingsPercent = monthlyPrice && yearlyPrice
    ? Math.max(0, Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100))
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 select-none">
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 px-4 py-2 border-[2px] border-black bg-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 font-black text-xs uppercase tracking-wider transition-all"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3px]" /> Kembali ke Dasbor
        </Link>
        <div className="flex items-center gap-2 border-[2px] border-black bg-[#bbf7d0] px-4 py-2 font-black text-xs uppercase tracking-wider">
          Status: {isPro ? 'Pro Active 👑' : 'Trial Active ⚡'}
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side: Pricing Options */}
        <div className="space-y-6">
          <div className="brutal-card p-6 bg-white">
            <h2 className="text-xl font-black text-black uppercase tracking-wider mb-2">Pilih Paket Norden Pro</h2>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-6">
              Mulai kelola keuangan Anda secara profesional dengan AI Norden.
            </p>

            <div className="space-y-4">
              {/* Monthly Plan */}
              {pricingPlans.monthly ? (
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`w-full p-4 border-[3px] border-black rounded-none text-left transition-all ${
                  selectedPlan === 'monthly' 
                    ? 'bg-[#fef08a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                    : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-black text-black uppercase text-sm">{pricingPlans.monthly.name}</h4>
                    {selectedPlan === 'monthly' && <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-none border-[1px] border-black">Dipilih</span>}
                  </div>
                  <p className="text-2xl font-black text-black tracking-wide">{formatCurrency(pricingPlans.monthly.price)} <span className="text-xs font-bold text-neutral-600">/ bulan</span></p>
                  <p className="text-[10px] font-bold text-neutral-600 mt-2 uppercase tracking-wide">Cocok untuk mencoba kenyamanan pencatatan AI.</p>
                </button>
              ) : (
                <div className="p-4 border-[3px] border-dashed border-black text-xs font-black uppercase text-neutral-500">Paket bulanan sedang dinonaktifkan.</div>
              )}

              {/* Yearly Plan */}
              {pricingPlans.yearly ? (
                <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`w-full p-4 border-[3px] border-black rounded-none text-left transition-all ${
                  selectedPlan === 'yearly' 
                    ? 'bg-[#bbf7d0] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                    : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-black text-black uppercase text-sm">{pricingPlans.yearly.name}</h4>
                    {yearlySavingsPercent !== null && yearlySavingsPercent > 0 && (
                      <span className="bg-black text-yellow-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-none border-[1px] border-black">Hemat {yearlySavingsPercent}%</span>
                    )}
                  </div>
                  <p className="text-2xl font-black text-black tracking-wide">{formatCurrency(pricingPlans.yearly.price)} <span className="text-xs font-bold text-neutral-600">/ tahun</span></p>
                  <p className="text-[10px] font-bold text-neutral-600 mt-2 uppercase tracking-wide">Pilihan terbaik untuk disiplin keuangan jangka panjang.</p>
                </button>
              ) : (
                <div className="p-4 border-[3px] border-dashed border-black text-xs font-black uppercase text-neutral-500">Paket tahunan sedang dinonaktifkan.</div>
              )}
            </div>

            {/* Plan Features */}
            <div className="mt-8 border-t-[3px] border-black pt-6">
              <h5 className="font-black text-black uppercase text-xs tracking-wider mb-4">Fitur yang Anda Dapatkan:</h5>
              <ul className="space-y-3">
                {planFeatures.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-bold text-black uppercase tracking-wide">
                    <Check className="w-4 h-4 text-emerald-800 stroke-[3px] flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="space-y-6">
          <div className="brutal-card p-6 bg-white">
            <h3 className="text-lg font-black text-black uppercase tracking-wider mb-4">Konfirmasi Pembayaran</h3>
            
            {error && (
              <div className="p-3 bg-red-100 border-[2px] border-black text-red-700 font-bold text-xs uppercase tracking-wider mb-4">
                ❌ {error}
              </div>
            )}
            {!paymentConfigured && (
              <div className="p-3 bg-yellow-100 border-[2px] border-black text-yellow-900 font-bold text-xs uppercase tracking-wider mb-4">
                Metode pembayaran belum aktif. Hubungi admin sebelum upgrade.
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-100 border-[2px] border-black text-emerald-800 font-bold text-xs uppercase tracking-wider mb-4">
                ✅ {success}
              </div>
            )}

            {/* Payment Method Tabs */}
            <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: `repeat(${Math.max(availableMethods.length, 1)}, minmax(0, 1fr))` }}>
              {availableMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 border-[2px] border-black font-black text-xs uppercase tracking-wider rounded-none transition-all ${
                    paymentMethod === method 
                      ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                      : 'bg-white text-black hover:bg-neutral-50'
                  }`}
                >
                  {method}
                </button>
              ))}
              {!paymentConfigured && (
                <button type="button" disabled className="py-2 border-[2px] border-black font-black text-xs uppercase tracking-wider rounded-none bg-neutral-100 text-neutral-500">
                  Belum tersedia
                </button>
              )}
            </div>

            {/* Payment Details Box */}
            <div className="p-4 border-[2px] border-black bg-[#f3f4f6] rounded-none mb-6">
              {paymentMethod === 'bca' && (
                <div>
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Bank BCA</p>
                  <p className="text-lg font-black text-black tracking-wider mt-1">{paymentSettings.bca_number}</p>
                  <p className="text-xs font-bold text-neutral-600 mt-1 uppercase">{paymentSettings.bca_holder}</p>
                </div>
              )}
              {paymentMethod === 'bni' && (
                <div>
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Bank BNI</p>
                  <p className="text-lg font-black text-black tracking-wider mt-1">{paymentSettings.bni_number}</p>
                  <p className="text-xs font-bold text-neutral-600 mt-1 uppercase">{paymentSettings.bni_holder}</p>
                </div>
              )}
              {paymentMethod === 'qris' && (
                <div className="flex flex-col items-center justify-center py-2">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">QRIS Norden Merchant</p>
                  {paymentSettings.qris_image ? (
                    <div className="bg-white p-3 border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
                      <img src={paymentSettings.qris_image} alt="QRIS Norden Merchant" className="max-w-[160px] max-h-[160px] object-contain border-[1px] border-neutral-250" />
                      <span className="text-[9px] font-black text-black tracking-widest mt-2 uppercase">SCAN QRIS MERCHANT</span>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">QRIS belum dikonfigurasi admin.</p>
                  )}
                </div>
              )}
              <div className="border-t-[1px] border-black mt-4 pt-3">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Pembayaran</p>
                <p className="text-base font-black text-black tracking-wide mt-0.5">
                  {hasSelectedPlan ? formatCurrency(pricingPlans[selectedPlan]!.price) : 'Paket tidak tersedia'}
                </p>
              </div>
            </div>

            {/* Proof Upload Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-black">Upload Bukti Transfer</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-[3px] border-dashed border-black bg-[#f9fafb] p-6 text-center cursor-pointer hover:bg-neutral-50 transition-all flex flex-col items-center justify-center"
                >
                  <Upload className="w-6 h-6 text-neutral-400 mb-2 stroke-[2.5px]" />
                  {file ? (
                    <span className="text-xs font-bold text-black truncate max-w-xs">{file.name}</span>
                  ) : (
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">PILIH FILE ATAU FOTO (MAX 5MB)</span>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || isPro || !hasSelectedPlan}
                className="w-full py-3 brutal-btn font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> MENGIRIM...
                  </>
                ) : isPro ? (
                  'SUDAH AKTIF PRO'
                ) : !hasSelectedPlan ? (
                  'PAKET TIDAK TERSEDIA'
                ) : !paymentConfigured ? (
                  'PEMBAYARAN TIDAK TERSEDIA'
                ) : (
                  'KIRIM BUKTI PEMBAYARAN'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Payment Requests History */}
      <div className="brutal-card p-6 bg-white">
        <h3 className="text-base font-black text-black uppercase tracking-wider mb-4">Riwayat Permintaan Upgrade</h3>
        {requests.length === 0 ? (
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider py-4 text-center">Belum ada riwayat pembayaran.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-[2px] border-black">
              <thead>
                <tr className="bg-[#f3f4f6] border-b-[2px] border-black">
                  <th className="p-3 text-[10px] font-black uppercase text-black tracking-wider border-r-[2px] border-black">Tanggal</th>
                  <th className="p-3 text-[10px] font-black uppercase text-black tracking-wider border-r-[2px] border-black">Paket</th>
                  <th className="p-3 text-[10px] font-black uppercase text-black tracking-wider border-r-[2px] border-black">Metode</th>
                  <th className="p-3 text-[10px] font-black uppercase text-black tracking-wider border-r-[2px] border-black">Total</th>
                  <th className="p-3 text-[10px] font-black uppercase text-black tracking-wider border-r-[2px] border-black">Status</th>
                  <th className="p-3 text-[10px] font-black uppercase text-black tracking-wider">Catatan Admin</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b-[2px] border-black last:border-b-0 hover:bg-[#fafafa] font-bold text-xs uppercase tracking-wide">
                    <td className="p-3 border-r-[2px] border-black text-neutral-500">
                      {new Date(req.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-3 border-r-[2px] border-black text-black">
                      PRO {req.billingType === 'monthly' ? 'Bulanan' : 'Tahunan'}
                    </td>
                    <td className="p-3 border-r-[2px] border-black text-black">{req.paymentMethod}</td>
                    <td className="p-3 border-r-[2px] border-black text-black">{formatCurrency(req.amount)}</td>
                    <td className="p-3 border-r-[2px] border-black">
                      <span className={`px-2 py-0.5 text-[10px] font-black border-[2px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                        req.status === 'approved' ? 'bg-[#bbf7d0] text-black' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-[#fef08a] text-black'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-600 normal-case italic">{req.adminNote || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { X, Loader2, Save } from 'lucide-react';
import { updateTransaction } from '../app/actions';
import { addCustomNotification } from '../app/actions/notifications';
import { formatCurrency } from '../lib/format';

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

export default function EditTransactionModal({ transaction, onClose }: Props) {
  const [form, setForm] = useState({
    type: transaction.type,
    category: transaction.category?.name || 'Lain-lain',
    amount: transaction.amount.toString(),
    method: transaction.wallet?.name || 'Lain-lain',
    note: transaction.note || '',
    transaction_date: transaction.transactionDate ? (typeof transaction.transactionDate === 'string' ? transaction.transactionDate.slice(0, 16) : transaction.transactionDate.toISOString().slice(0, 16)) : '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const numericAmount = parseInt(form.amount.replace(/\D/g, ''), 10) || 0;

    const res = await updateTransaction(transaction.id, {
      type: form.type as TransactionType,
      category: form.category,
      amount: numericAmount,
      wallet: form.method,
      note: form.note,
      transactionDate: new Date(form.transaction_date).toISOString(),
    });

    if (res.success) {
      setSuccess('Transaksi berhasil diperbarui!');
      // Add custom notification for premium user experience
      await addCustomNotification(
        'Transaksi Diperbarui',
        `Detail transaksi nominal ${formatCurrency(numericAmount)} kategori ${form.category} telah berhasil diubah.`,
        'TRANSACTION_EDIT'
      );
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } else {
      setError(res.error || 'Gagal menyimpan');
    }
    setLoading(false);
  };

  const inputClass = "w-full brutal-input px-3 py-2 text-sm font-bold uppercase";
  const labelClass = "text-[10px] font-black text-black mb-1 block uppercase tracking-widest";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white border-[3px] border-black rounded-none w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b-[3px] border-black bg-white">
          <h3 className="text-base font-black text-black uppercase tracking-wider">Edit Transaksi</h3>
          <button onClick={onClose} className="p-1 border-[2px] border-black bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer">
            <X className="w-4 h-4 text-black stroke-[2.5px]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {success && (
            <div className="p-3 border-[2px] border-black bg-[#bbf7d0] text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
              {success}
            </div>
          )}

          {error && (
            <div className="p-3 border-[2px] border-black bg-[#fecaca] text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Jenis</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as TransactionType })}
                className="w-full brutal-input px-3 py-2 text-sm font-black uppercase"
              >
                <option value="masuk">Masuk</option>
                <option value="keluar">Keluar</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Kategori</label>
              <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClass} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nominal</label>
              <input type="text" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full brutal-input px-3 py-2 text-sm font-bold" required />
            </div>
            <div>
              <label className={labelClass}>Metode / Dompet</label>
              <input type="text" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className={labelClass}>Keterangan</label>
            <input type="text" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Tanggal & Waktu</label>
            <input type="datetime-local" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} className="w-full brutal-input px-3 py-2 text-sm font-bold" required />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 brutal-btn-light py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 brutal-btn py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer">
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white stroke-[2.5px]" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

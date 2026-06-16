'use client';

import { useState } from 'react';
import { Budget, Transaction } from '../types';
import { addBudget, deleteBudget } from '../app/actions';
import { formatRupiah } from '../lib/format';
import { Trash2, AlertTriangle } from 'lucide-react';

interface BudgetManagerProps {
  budgets: Budget[];
  transactions: Transaction[];
  isPro: boolean;
}

export default function BudgetManager({ budgets, transactions }: BudgetManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Calculate current month spending per budget category
  const budgetsWithSpending = budgets.map(budget => {
    const spending = transactions
      .filter(t => 
        t.type === 'keluar' && 
        t.category?.name.toLowerCase() === budget.category?.name.toLowerCase() &&
        new Date(t.transactionDate) >= startOfMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const percentage = budget.monthlyLimit > 0 ? (spending / budget.monthlyLimit) * 100 : 0;
    const isExceeded = spending > budget.monthlyLimit;

    return {
      ...budget,
      spending,
      percentage,
      isExceeded
    };
  });

  async function handleAddBudget(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!category.trim() || !limit) {
      setError('Harap isi semua kolom');
      return;
    }

    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum <= 0) {
      setError('Limit bulanan harus berupa angka positif');
      return;
    }

    const res = await addBudget(category, limitNum);
    if (res.success) {
      setCategory('');
      setLimit('');
      setShowForm(false);
      setSuccess('Budget bulanan berhasil ditambahkan!');
      setTimeout(() => setSuccess(null), 5000);
    } else {
      setError(res.error || 'Gagal menambahkan budget');
    }
  }

  async function handleDeleteBudget(id: string) {
    setSuccess(null);
    if (confirm('Apakah Anda yakin ingin menghapus budget ini?')) {
      await deleteBudget(id);
      setSuccess('Budget bulanan berhasil dihapus!');
      setTimeout(() => setSuccess(null), 5000);
    }
  }

  return (
    <div className="brutal-card p-6 bg-white select-none">
      <div className="flex justify-between items-center mb-6 border-b-[3px] border-black pb-4">
        <h3 className="text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
          🎯 Budget Kategori
        </h3>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            setError(null);
          }} 
          className="brutal-btn-light text-xs px-4 py-2 cursor-pointer"
        >
          {showForm ? 'Batal' : 'Atur Budget'}
        </button>
      </div>

      {success && (
        <div className="p-3 border-[2px] border-black bg-[#bbf7d0] text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4 animate-in fade-in duration-200">
          {success}
        </div>
      )}

      <>
        {showForm && (
          <form onSubmit={handleAddBudget} className="mb-6 p-4 border-[3px] border-black bg-white space-y-4 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
            {error && <p className="text-xs font-black text-red-650 uppercase tracking-wider">{error}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-black uppercase mb-1 tracking-widest">Kategori</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  className="w-full brutal-input p-2 text-xs font-black uppercase"
                >
                  <option value="">Pilih Kategori</option>
                  <option value="makan">Makan</option>
                  <option value="transport">Transport</option>
                  <option value="langganan">Langganan</option>
                  <option value="topup">Topup</option>
                  <option value="belanja">Belanja</option>
                  <option value="cicilan">Cicilan</option>
                  <option value="lain-lain">Lain-lain</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-black uppercase mb-1 tracking-widest">Limit Bulanan</label>
                <input 
                  type="number" 
                  placeholder="Rp" 
                  value={limit} 
                  onChange={e => setLimit(e.target.value)}
                  className="w-full brutal-input p-2 text-xs font-bold"
                />
              </div>
            </div>
            <button type="submit" className="w-full brutal-btn py-2 text-xs font-black uppercase tracking-wider cursor-pointer">
              Simpan Budget
            </button>
          </form>
        )}

        {budgetsWithSpending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 bg-white border-[3px] border-dashed border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center px-4">
            <div className="p-2 border-[2px] border-black bg-[#FFE066] mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0">
              <span className="text-lg font-black text-black">📊</span>
            </div>
            <p className="text-sm font-black text-black uppercase tracking-wider">Belum ada budget bulanan</p>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mt-1">Atur budget per kategori untuk membatasi pengeluaran Anda tiap bulan.</p>
            <button
              onClick={() => {
                setShowForm(true);
                setError(null);
              }}
              className="mt-4 brutal-btn px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              + Atur Budget Baru
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetsWithSpending.map(b => (
              <div key={b.id} className={`p-4 border-[2px] border-black rounded-none bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${b.isExceeded ? 'bg-red-50/50 border-red-300 shadow-none' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-black bg-white rounded-none px-2 py-0.5 border-[2px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      {b.category?.name}
                    </span>
                    {b.isExceeded && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-650 uppercase tracking-widest">
                        <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5px]" /> Over budget!
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDeleteBudget(b.id)}
                    className="text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-end text-xs font-black text-black mt-2 tracking-wider">
                  <span>{formatRupiah(b.spending)}</span>
                  <span className="text-neutral-500 font-bold uppercase">Limit: {formatRupiah(b.monthlyLimit)}</span>
                </div>

                {/* Progress bar container */}
                <div className="w-full bg-[#f3f4f6] border-[2px] border-black h-4 rounded-none overflow-hidden mt-2 relative shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <div 
                    className={`h-full rounded-none transition-all duration-500 border-r-[2px] border-black ${
                      b.isExceeded ? 'bg-red-500' : b.percentage >= 80 ? 'bg-[#fef08a]' : 'bg-[#bbf7d0]'
                    }`}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-end mt-1 text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                  {Math.round(b.percentage)}% terpakai
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    </div>
  );
}

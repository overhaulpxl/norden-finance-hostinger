'use client';

import { useState } from 'react';
import { Debt, DebtType } from '../types';
import { formatRupiah } from '../lib/format';
import { Loader2, Trash2 } from 'lucide-react';
import { addDebt, toggleDebtSettled, deleteDebt } from '../app/actions';

export default function DebtList({ debts }: { debts: Debt[] }) {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<DebtType>('piutang');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [tenor, setTenor] = useState('');
  const [interest, setInterest] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'settled'>('active');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person.trim() || !amount) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    const numericAmount = parseInt(amount.replace(/\D/g, ''), 10);
    const numericTenor = parseInt(tenor.replace(/\D/g, ''), 10);
    const numericInterest = parseFloat(interest);

    if (!numericAmount) {
      setError('Nominal tidak valid');
      setLoading(false);
      return;
    }
    
    const res = await addDebt({
      type: formType,
      person,
      amount: numericAmount,
      note: note.trim() || undefined,
      tenorMonths: !isNaN(numericTenor) ? numericTenor : undefined,
      interestRate: !isNaN(numericInterest) ? numericInterest : undefined
    });
    
    if (res.success) {
      setPerson('');
      setAmount('');
      setNote('');
      setTenor('');
      setInterest('');
      setShowForm(false);
      setSuccess('Catatan berhasil ditambahkan!');
      setTimeout(() => setSuccess(null), 5000);
    } else {
      setError(res.error || 'Gagal menyimpan');
    }
    setLoading(false);
  };

  const handleSettle = async (id: string) => {
    setSuccess(null);
    const res = await toggleDebtSettled(id);
    if (res.success) {
      setSuccess('Status utang/piutang berhasil diperbarui!');
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
      setSuccess(null);
      const res = await deleteDebt(id);
      if (res.success) {
        setSuccess('Catatan berhasil dihapus!');
        setTimeout(() => setSuccess(null), 5000);
      }
    }
  };

  const filteredDebts = debts.filter(d => {
    if (filter === 'active') return !d.isSettled;
    if (filter === 'settled') return d.isSettled;
    return true;
  });

  const totalPiutang = debts.filter(d => d.type === 'piutang' && !d.isSettled).reduce((a, c) => a + c.amount, 0);
  const totalHutang = debts.filter(d => d.type === 'hutang' && !d.isSettled).reduce((a, c) => a + c.amount, 0);

  return (
    <div className="brutal-card p-6 bg-white select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h3 className="text-lg font-black text-black uppercase tracking-wider">Utang & Piutang</h3>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            setError(null);
          }} 
          className="brutal-btn-light text-xs px-4 py-2 cursor-pointer"
        >
          {showForm ? 'Cancel' : '+ New Debt'}
        </button>
      </div>

      {success && (
        <div className="p-3 border-[2px] border-black bg-[#bbf7d0] text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4 animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 border-[2px] border-black bg-[#fecaca] text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4 animate-in fade-in duration-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8 bg-white border-[3px] border-black rounded-none p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Piutang (Diberikan)</p>
          <p className="text-lg font-black text-emerald-700 tracking-wide">{formatRupiah(totalPiutang)}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Hutang (Diterima)</p>
          <p className="text-lg font-black text-red-650 tracking-wide">{formatRupiah(totalHutang)}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 border-[3px] border-black bg-white p-4 space-y-4 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
          <select value={formType} onChange={e => setFormType(e.target.value as DebtType)} className="w-full brutal-input px-4 py-2.5 text-sm font-black uppercase">
            <option value="piutang">Piutang (Orang berhutang ke saya)</option>
            <option value="hutang">Hutang (Saya berhutang ke orang)</option>
          </select>
          <div className="flex gap-3">
            <input type="text" placeholder="Nama" value={person} onChange={e => setPerson(e.target.value)} className="flex-1 brutal-input px-4 py-2.5 text-sm font-bold uppercase" required />
            <input type="text" placeholder="Nominal" value={amount} onChange={e => setAmount(e.target.value)} className="flex-1 brutal-input px-4 py-2.5 text-sm font-bold" required />
          </div>
          <input type="text" placeholder="Catatan (opsional)" value={note} onChange={e => setNote(e.target.value)} className="w-full brutal-input px-4 py-2.5 text-sm font-bold uppercase" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Tenor (Bln)" value={tenor} onChange={e => setTenor(e.target.value)} className="w-full brutal-input px-4 py-2.5 text-sm font-bold" />
            <input type="number" step="0.1" placeholder="Bunga (%)" value={interest} onChange={e => setInterest(e.target.value)} className="w-full brutal-input px-4 py-2.5 text-sm font-bold" />
          </div>
          <button type="submit" disabled={loading} className="w-full brutal-btn py-3 flex justify-center items-center cursor-pointer">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : 'Simpan'}
          </button>
        </form>
      )}

      <div className="flex gap-6 mb-6 border-b-[3px] border-black">
        {(['active', 'settled', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-sm pb-3 border-b-[3px] transition-all font-black uppercase tracking-wider mb-[-3px] cursor-pointer ${filter === f ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'}`}>
            {f === 'active' ? 'Active' : f === 'settled' ? 'Settled' : 'All'}
          </button>
        ))}
      </div>

      {filteredDebts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white border-[3px] border-dashed border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center px-4">
          <div className="p-2 border-[2px] border-black bg-[#FFE066] mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0">
            <span className="text-lg font-black text-black">🤝</span>
          </div>
          <p className="text-sm font-black text-black uppercase tracking-wider">Belum ada catatan utang/piutang</p>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mt-1">Catat utang atau piutang agar pembayaran atau penagihan Anda tetap terjadwal.</p>
          <button
            onClick={() => {
              setShowForm(true);
              setError(null);
            }}
            className="mt-4 brutal-btn px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            + Catat Baru
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDebts.map(d => (
            <div key={d.id} className={`p-4 border-[2px] border-black rounded-none flex flex-col justify-between items-start group transition-all bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${d.isSettled ? 'opacity-60 bg-neutral-50 shadow-none border-neutral-300' : ''}`}>
              <div className="w-full flex justify-between items-start mb-2">
                <div>
                  <span className={`text-base font-black uppercase tracking-wider block mb-0.5 ${d.isSettled ? 'text-neutral-400 line-through' : 'text-black'}`}>{d.person}</span>
                  {d.note && <span className="text-xs font-bold text-neutral-500 block capitalize">{d.note}</span>}
                </div>
                <span className={`text-base font-black tracking-wider ${d.isSettled ? 'text-neutral-400' : d.type === 'hutang' ? 'text-red-600' : 'text-emerald-700'}`}>{formatRupiah(d.amount)}</span>
              </div>
              
              {d.tenorMonths && (
                <div className="w-full mt-2 pt-2 border-t-[2px] border-black">
                  <div className="flex justify-between text-[10px] font-black text-neutral-500 mb-1 uppercase tracking-widest">
                    <span>Tenor: {d.tenorMonths} bln</span>
                    {d.interestRate && <span>Bunga: {d.interestRate}%</span>}
                  </div>
                </div>
              )}

              <div className="w-full flex justify-between items-center mt-3">
                <button 
                  onClick={() => handleSettle(d.id)}
                  className="brutal-btn-light px-3 py-1.5 text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  {d.isSettled ? 'Undo Settle' : 'Mark as Settled'}
                </button>
                <button 
                  onClick={() => handleDelete(d.id)}
                  className="text-neutral-400 hover:text-red-650 opacity-0 group-hover:opacity-100 transition-all p-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

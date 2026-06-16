'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Balance, Transaction } from '../types';
import { formatRupiah, formatTanggal, formatMethodName } from '../lib/format';
import { Search, Trash2, Edit2, Check, X, Download, ArrowDownRight, ArrowUpRight, ArrowRightLeft } from 'lucide-react';
import { updateTransaction, deleteTransaction } from '../app/actions';
import WalletSelect from './WalletSelect';

export default function TransactionTable({ transactions, balances = [] }: { transactions: Transaction[]; balances?: Balance[] }) {
  const router = useRouter();
  const [transactionOverrides, setTransactionOverrides] = useState<Record<string, Transaction>>({});
  const [deletedTransactionIds, setDeletedTransactionIds] = useState<Set<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterTag, setFilterTag] = useState('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editMethod, setEditMethod] = useState('');
  const [editTags, setEditTags] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingMutationId, setPendingMutationId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleTransactions = transactions
    .filter((transaction) => !deletedTransactionIds.has(transaction.id))
    .map((transaction) => transactionOverrides[transaction.id] || transaction);

  const months = Array.from(new Set(visibleTransactions.map(t => {
    const d = new Date(t.transactionDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }))).sort().reverse();

  const categories = Array.from(new Set(visibleTransactions.map(t => t.category?.name || 'Lain-lain'))).sort();
  const methods = Array.from(new Set(visibleTransactions.map(t => t.wallet?.name || 'Lain-lain'))).sort();
  
  const uniqueTags = Array.from(new Set(
    visibleTransactions.flatMap((t) => t.tags || [])
  )).sort();

  const filtered = visibleTransactions.filter(t => {
    const tags = t.tags || [];
    const query = searchQuery.toLowerCase();
    const haystack = [
      t.category?.name || 'Lain-lain',
      t.note || '',
      t.wallet?.name || '',
      t.rawInput || '',
      ...tags.map((tag) => `#${tag}`)
    ].join(' ').toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    
    const d = new Date(t.transactionDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const matchesMonth = filterMonth === 'all' || monthKey === filterMonth;
    
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || (t.category?.name || 'Lain-lain') === filterCategory;
    const matchesMethod = filterMethod === 'all' || (t.wallet?.name || 'Lain-lain') === filterMethod;
    const matchesTag = filterTag === 'all' || tags.includes(filterTag);

    return matchesSearch && matchesMonth && matchesType && matchesCategory && matchesMethod && matchesTag;
  });

  const exportTransactionsToCSV = (txList: Transaction[]) => {
    if (txList.length === 0) return;
    const headers = ['Tanggal', 'Jenis', 'Kategori', 'Nominal', 'Metode', 'Keterangan', 'Tags'];
    const rows = txList.map(t => [
      formatTanggal(t.transactionDate),
      t.type,
      t.category?.name || 'Lain-lain',
      t.amount,
      t.wallet?.name || 'Lain-lain',
      t.note || '-',
      (t.tags || []).join(' ')
    ]);
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const csvContent = [headers.map(escapeCsv).join(','), ...rows.map(row => row.map(escapeCsv).join(','))].join("\n");
    const encodedUri = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `norden-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  const handleEditSave = async (id: string) => {
    if (pendingMutationId) return;
    const amount = parseInt(editAmount.replace(/\D/g, ''), 10);
    if (!amount) return;
    if (!editMethod.trim()) {
      setError('Pilih wallet terlebih dahulu');
      return;
    }
    
    setError(null);
    setSuccess(null);
    setPendingMutationId(id);
    const tags = editTags.split(/\s+/).map(tag => tag.replace(/^#/, '').trim()).filter(Boolean);
    const res = await updateTransaction(id, { amount, note: editNote, wallet: editMethod, tags });
    if (res.success) {
      const wallet = balances.find((balance) => balance.name === editMethod);
      const currentTransaction = visibleTransactions.find((transaction) => transaction.id === id);
      if (currentTransaction) {
        setTransactionOverrides((current) => ({
          ...current,
          [id]: {
            ...currentTransaction,
            amount,
            note: editNote,
            tags,
            wallet: wallet
              ? {
                  id: wallet.id,
                  name: wallet.name,
                  type: wallet.type,
                  currentBalance: wallet.currentBalance,
                  userId: wallet.userId,
                  archivedAt: wallet.archivedAt,
                  createdAt: wallet.createdAt,
                  updatedAt: wallet.updatedAt,
                }
              : currentTransaction.wallet,
          },
        }));
      }
      setEditingId(null);
      setSuccess('Transaksi berhasil diperbarui!');
      setTimeout(() => setSuccess(null), 5000);
      router.refresh();
    } else {
      setError(res.error || 'Gagal memperbarui transaksi');
    }
    setPendingMutationId(null);
  };

  const handleDelete = async (id: string) => {
    if (pendingMutationId) return;
    setError(null);
    setSuccess(null);
    setPendingMutationId(id);
    const res = await deleteTransaction(id);
    if (res.success) {
      setDeletedTransactionIds((current) => {
        const next = new Set(current);
        next.add(id);
        return next;
      });
      setDeletingId(null);
      setSuccess('Transaksi berhasil dihapus!');
      setTimeout(() => setSuccess(null), 5000);
      router.refresh();
    } else {
      setError(res.error || 'Gagal menghapus transaksi');
    }
    setPendingMutationId(null);
  };

  const selectClass = "bg-white border-[3px] border-black text-black font-black text-xs rounded-none px-3 py-2 outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider appearance-none cursor-pointer";

  return (
    <div className="select-none">
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black stroke-[3px]" />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full brutal-input pl-9 pr-4 py-2 text-xs font-bold uppercase"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className={selectClass}>
            <option value="all">Semua Bulan</option>
            {months.map(m => {
              const [y, mo] = m.split('-');
              const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectClass}>
            <option value="all">Semua Jenis</option>
            <option value="masuk">Pemasukan</option>
            <option value="keluar">Pengeluaran</option>
            <option value="transfer">Transfer</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectClass}>
            <option value="all">Semua Kategori</option>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className={selectClass}>
            <option value="all">Semua Wallet</option>
            {methods.map(m => <option key={m} value={m}>{formatMethodName(m)}</option>)}
          </select>
          {uniqueTags.length > 0 && (
            <select value={filterTag} onChange={e => setFilterTag(e.target.value)} className={selectClass}>
              <option value="all">Semua Tag</option>
              {uniqueTags.map(tag => <option key={tag} value={tag}>#{tag}</option>)}
            </select>
          )}
          {filtered.length > 0 && (
            <button
              onClick={() => exportTransactionsToCSV(filtered)}
              className="brutal-btn-light px-3 py-2 text-xs flex items-center gap-1.5 font-black uppercase tracking-wider cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5px]" /> Export
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white border-[3px] border-black border-dashed rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-neutral-400 font-black text-xs uppercase tracking-wider">Tidak ada transaksi ditemukan.</p>
          </div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="border-[2px] border-black rounded-none p-4 bg-white flex items-center justify-between group transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-none border-[2px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                  t.type === 'masuk' ? 'bg-[#bbf7d0] text-black' : 
                  t.type === 'transfer' ? 'bg-[#bfdbfe] text-black' : 
                  'bg-[#fecaca] text-black'
                }`}>
                  {t.type === 'masuk' ? <ArrowDownRight className="w-4 h-4 stroke-[3px]" /> : 
                   t.type === 'transfer' ? <ArrowRightLeft className="w-4 h-4 stroke-[3px]" /> : 
                   <ArrowUpRight className="w-4 h-4 stroke-[3px]" />}
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-sm text-black uppercase tracking-wider">{t.category?.name || 'Lain-lain'}</h4>
                  </div>
                  
                  {editingId === t.id ? (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <input 
                        type="text" 
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                        className="bg-white border-[2px] border-black rounded-none px-2.5 py-1 text-xs text-black outline-none font-bold uppercase"
                        placeholder="Catatan..."
                      />
                      <WalletSelect
                        wallets={balances}
                        value={editMethod}
                        onChange={setEditMethod}
                        className="w-20 bg-white border-[2px] border-black rounded-none px-2.5 py-1 text-xs text-black outline-none uppercase font-black"
                        required
                      />
                      <input 
                        type="text" 
                        value={editTags}
                        onChange={e => setEditTags(e.target.value)}
                        className="w-24 bg-white border-[2px] border-black rounded-none px-2.5 py-1 text-xs text-black outline-none font-bold uppercase"
                        placeholder="#tags..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400 font-bold uppercase tracking-wider">
                        <span className="text-black font-black">{t.note || '-'}</span>
                        <span className="h-1.5 w-1.5 rounded-none bg-black"></span>
                        <span className="text-black font-black">{formatMethodName(t.wallet?.name || 'Lain-lain')}</span>
                        <span className="h-1.5 w-1.5 rounded-none bg-black"></span>
                        <span className="text-neutral-500">{formatTanggal(t.transactionDate)}</span>
                      </div>
                      {(t.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(t.tags || []).map((tag) => (
                            <span key={tag} className="border-[1.5px] border-black bg-[#e0f2fe] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-black">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  {editingId === t.id ? (
                    <input 
                      type="text" 
                      value={editAmount}
                      onChange={e => setEditAmount(e.target.value)}
                      className="w-24 bg-white border-[2px] border-black rounded-none px-2.5 py-1 text-xs text-black font-black outline-none text-right"
                      autoFocus
                    />
                  ) : (
                    <span className={`text-base font-black tracking-wider ${
                      t.type === 'masuk' ? 'text-emerald-700' : 
                      t.type === 'transfer' ? 'text-blue-700' : 
                      'text-black'
                    }`}>
                      {t.type === 'masuk' ? '+' : t.type === 'transfer' ? '' : '-'}{formatRupiah(t.amount)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity w-16 justify-end">
                  {editingId === t.id ? (
                    <>
                      <button disabled={pendingMutationId === t.id} onClick={() => handleEditSave(t.id)} className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-none transition-colors border border-transparent hover:border-black cursor-pointer disabled:opacity-50"><Check className="w-4 h-4 stroke-[3px]" /></button>
                      <button disabled={pendingMutationId === t.id} onClick={() => setEditingId(null)} className="p-1.5 text-neutral-500 hover:bg-neutral-50 rounded-none transition-colors border border-transparent hover:border-black cursor-pointer disabled:opacity-50"><X className="w-4 h-4 stroke-[3px]" /></button>
                    </>
                  ) : deletingId === t.id ? (
                    <>
                      <button disabled={pendingMutationId === t.id} onClick={() => handleDelete(t.id)} className="p-1 text-red-650 hover:bg-red-50 rounded-none text-xs font-black transition-colors border border-transparent hover:border-black cursor-pointer disabled:opacity-50">Y</button>
                      <button disabled={pendingMutationId === t.id} onClick={() => setDeletingId(null)} className="p-1 text-neutral-500 hover:bg-neutral-150 rounded-none text-xs font-black transition-colors border border-transparent hover:border-black cursor-pointer disabled:opacity-50">N</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(t.id); setEditAmount(t.amount.toString()); setEditNote(t.note || ''); setEditMethod(t.wallet?.name || ''); setEditTags((t.tags || []).map(tag => `#${tag}`).join(' ')); }} className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-none transition-colors cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDeletingId(t.id)} className="p-1.5 text-neutral-500 hover:text-red-650 hover:bg-red-50 rounded-none transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

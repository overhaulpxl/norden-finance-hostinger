'use client';

import { useMemo } from 'react';
import { Transaction } from '../types';
import { formatRupiah } from '../lib/format';

export default function MonthlyRecap({ transactions }: { transactions: Transaction[] }) {
  const monthlyData = useMemo(() => {
    const map: Record<string, { masuk: number; keluar: number }> = {};
    transactions.filter(t => t.type !== 'transfer').forEach(tx => {
      const d = new Date(tx.transactionDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { masuk: 0, keluar: 0 };
      if (tx.type === 'masuk') map[key].masuk += tx.amount;
      if (tx.type === 'keluar') map[key].keluar += tx.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, data]) => {
        const [y, m] = month.split('-');
        const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        return { key: month, label, ...data, net: data.masuk - data.keluar };
      });
  }, [transactions]);

  if (monthlyData.length === 0) {
    return (
      <div className="brutal-card p-6 bg-white flex flex-col items-center justify-center min-h-[200px] select-none">
        <h3 className="text-sm font-black text-black uppercase tracking-wider mb-6 w-full text-left border-b-[2px] border-black pb-2">Rekap Bulanan</h3>
        <p className="text-neutral-400 font-black text-xs uppercase tracking-widest">Belum ada data transaksi.</p>
      </div>
    );
  }

  return (
    <div className="brutal-card p-6 bg-white select-none">
      <h3 className="text-sm font-black text-black uppercase tracking-wider mb-6 border-b-[2px] border-black pb-2">Rekap Bulanan</h3>
      <div className="space-y-4">
        {monthlyData.map(m => {
          const surplus = m.masuk - m.keluar;
          return (
            <div key={m.key} className="border-b-[2px] border-neutral-100 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-black text-black uppercase tracking-wider">{m.label}</span>
                <span className={`text-base font-black tracking-wider ${surplus >= 0 ? 'text-emerald-700' : 'text-black'}`}>
                  {surplus >= 0 ? '+' : '-'}{formatRupiah(Math.abs(surplus))}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block">Pemasukan</span>
                  <span className="font-black text-emerald-700 text-xs tracking-wider">{formatRupiah(m.masuk)}</span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block">Pengeluaran</span>
                  <span className="font-black text-red-650 text-red-600 text-xs tracking-wider">{formatRupiah(m.keluar)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

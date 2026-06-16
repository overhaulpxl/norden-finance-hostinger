'use client';

import { useMemo } from 'react';
import { Transaction } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatRupiah } from '../lib/format';

const COLORS = [
  '#000000', // Black
  '#bbf7d0', // Mint
  '#fef08a', // Yellow
  '#bfdbfe', // Blue
  '#fecaca', // Red
  '#ddd6fe', // Purple
  '#fed7aa', // Orange
  '#f5d0fe', // Pink
];

export default function ExpenseChart({ transactions }: { transactions: Transaction[] }) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const chartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    transactions.forEach(tx => {
      const d = new Date(tx.transactionDate);
      if (tx.type === 'keluar' && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const catName = tx.category?.name || 'Lain-lain';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + tx.amount;
      }
    });
    return Object.entries(categoryTotals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions, currentMonth, currentYear]);

  if (chartData.length === 0) {
    return (
      <div className="brutal-card p-6 bg-white flex flex-col items-center justify-center min-h-[220px] select-none">
        <h3 className="text-sm font-black text-black uppercase tracking-wider mb-6 w-full text-left border-b-[2px] border-black pb-2">Distribusi Pengeluaran</h3>
        <p className="text-neutral-400 font-black text-xs uppercase tracking-widest">Tidak ada pengeluaran bulan ini.</p>
      </div>
    );
  }

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="brutal-card p-6 bg-white select-none">
      <h3 className="text-sm font-black text-black uppercase tracking-wider mb-6 border-b-[2px] border-black pb-2">Distribusi Pengeluaran</h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={28} outerRadius={55} paddingAngle={4} dataKey="value" stroke="#000000" strokeWidth={2.5}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '3px solid #000000', borderRadius: '0px', fontSize: '11px', fontWeight: 'bold', boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)' }}
                itemStyle={{ color: '#000000', fontWeight: '900' }}
                formatter={(value: unknown) => formatRupiah(Number(value || 0))}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 grid grid-cols-1 gap-1.5 w-full">
          {chartData.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={item.name} className="flex items-center gap-3 border-b-2 border-neutral-100 pb-2 mb-1.5 last:border-0 last:pb-0 last:mb-0">
                <div className="w-2.5 h-2.5 rounded-none border border-black flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <div className="flex-1 min-w-0 flex justify-between items-center text-xs">
                  <div className="font-black text-black uppercase tracking-wider">{item.name}</div>
                  <div className="font-black text-black tracking-wider">{formatRupiah(item.value)} <span className="text-neutral-400 font-bold ml-1">({percentage}%)</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

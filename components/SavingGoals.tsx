'use client';

import { useMemo, useState } from 'react';
import { SavingGoal, Transaction } from '../types';
import { formatRupiah } from '../lib/format';
import { Loader2, TrendingUp } from 'lucide-react';
import { addSavingGoal, updateSavingGoal, deleteSavingGoal } from '../app/actions';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface SavingGoalsProps {
  goals: SavingGoal[];
  transactions?: Transaction[];
}

interface MonthlySavingPoint {
  key: string;
  label: string;
  saving: number;
}

const MONTH_FORMATTER = new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' });
const COMPLETION_FORMATTER = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
const SHORT_RUPIAH_FORMATTER = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  return next;
}

function buildMonthlySavings(transactions: Transaction[]): MonthlySavingPoint[] {
  const monthMap = new Map<string, { date: Date; income: number; expense: number }>();

  transactions.forEach((tx) => {
    if (tx.type === 'transfer') return;
    const date = new Date(tx.transactionDate);
    if (Number.isNaN(date.getTime())) return;

    const monthDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const key = getMonthKey(monthDate);
    const existing = monthMap.get(key) ?? { date: monthDate, income: 0, expense: 0 };

    if (tx.type === 'masuk') existing.income += tx.amount;
    if (tx.type === 'keluar') existing.expense += tx.amount;

    monthMap.set(key, existing);
  });

  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([key, value]) => ({
      key,
      label: MONTH_FORMATTER.format(value.date),
      saving: value.income - value.expense,
    }));
}

function buildGoalProjection(goal: SavingGoal, monthlySavings: MonthlySavingPoint[]) {
  const positiveMonths = monthlySavings.filter((point) => point.saving > 0);
  const avgMonthlySaving = positiveMonths.length > 0
    ? positiveMonths.reduce((sum, point) => sum + point.saving, 0) / positiveMonths.length
    : 0;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const isCompleted = remaining <= 0;
  const hasProjection = isCompleted || (monthlySavings.length >= 2 && avgMonthlySaving > 0);
  const monthsToComplete = isCompleted ? 0 : Math.ceil(remaining / avgMonthlySaving);
  const completionDate = hasProjection ? addMonths(new Date(), monthsToComplete) : null;
  const boostedMonths = avgMonthlySaving > 0 ? Math.ceil(remaining / (avgMonthlySaving + 500000)) : null;
  const fasterByMonths = boostedMonths === null ? 0 : Math.max(monthsToComplete - boostedMonths, 0);

  let historicalValue = Math.max(
    0,
    goal.currentAmount - positiveMonths.reduce((sum, point) => sum + point.saving, 0),
  );

  const chartData = monthlySavings.map((point) => {
    historicalValue = Math.min(goal.currentAmount, Math.max(0, historicalValue + Math.max(point.saving, 0)));
    return {
      label: point.label,
      saved: Math.round(historicalValue),
      target: goal.targetAmount,
    };
  });

  if (hasProjection && !isCompleted) {
    let projectedValue = goal.currentAmount;
    for (let index = 1; index <= Math.min(monthsToComplete, 12); index += 1) {
      projectedValue = Math.min(goal.targetAmount, projectedValue + avgMonthlySaving);
      chartData.push({
        label: MONTH_FORMATTER.format(addMonths(new Date(), index)),
        saved: Math.round(projectedValue),
        target: goal.targetAmount,
      });
    }
  } else if (chartData.length === 0) {
    chartData.push({
      label: 'Saat ini',
      saved: goal.currentAmount,
      target: goal.targetAmount,
    });
  }

  return {
    avgMonthlySaving,
    completionDate,
    fasterByMonths,
    hasProjection,
    isCompleted,
    monthsToComplete,
    remaining,
    chartData,
  };
}

export default function SavingGoals({ goals, transactions = [] }: SavingGoalsProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const monthlySavings = useMemo(() => buildMonthlySavings(transactions), [transactions]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;
    setLoading(true);
    setSuccess(null);
    const amount = parseInt(targetAmount.replace(/\D/g, ''), 10) || 0;
    const res = await addSavingGoal(name, amount);
    if (res.success) { 
      setName(''); 
      setTargetAmount(''); 
      setShowForm(false); 
      setSuccess('Target tabungan berhasil ditambahkan!');
      setTimeout(() => setSuccess(null), 5000);
    }
    setLoading(false);
  };

  const handleUpdateCurrent = async (id: string) => {
    if (!editAmount) return;
    setLoading(true);
    setSuccess(null);
    const amount = parseInt(editAmount.replace(/\D/g, ''), 10) || 0;
    const res = await updateSavingGoal(id, { currentAmount: amount });
    if (res.success) {
      setEditingId(null); 
      setEditAmount(''); 
      setSuccess('Progres target tabungan berhasil diperbarui!');
      setTimeout(() => setSuccess(null), 5000);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus target tabungan ini?')) return;
    setSuccess(null);
    const res = await deleteSavingGoal(id);
    if (res.success) {
      setSuccess('Target tabungan berhasil dihapus!');
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  return (
    <div className="brutal-card p-6 bg-white select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h3 className="text-lg font-black text-black uppercase tracking-wider">Target Tabungan</h3>
        <button onClick={() => setShowForm(!showForm)} className="brutal-btn-light text-xs px-4 py-2 cursor-pointer">
          {showForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {success && (
        <div className="p-3 border-[2px] border-black bg-[#bbf7d0] text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4 animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 brutal-card bg-white p-5 flex flex-col sm:flex-row gap-3 border-[3px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <input type="text" placeholder="Name (e.g. Macbook)" value={name} onChange={e => setName(e.target.value)} className="flex-1 brutal-input px-4 py-2 text-sm" required />
          <input type="text" placeholder="Target Amount" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="flex-1 brutal-input px-4 py-2 text-sm" required />
          <button type="submit" disabled={loading} className="brutal-btn px-5 py-2.5 min-w-[80px] flex justify-center items-center cursor-pointer">
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Save'}
          </button>
        </form>
      )}

      {(!goals || goals.length === 0) && !showForm ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white border-[3px] border-dashed border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center px-4">
          <div className="p-2 border-[2px] border-black bg-[#FFE066] mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0">
            <span className="text-lg font-black text-black">🎯</span>
          </div>
          <p className="text-sm font-black text-black uppercase tracking-wider">Belum ada target tabungan</p>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mt-1">Buat target pencapaian tabungan Anda (misal: Beli Laptop) untuk memotivasi menyisihkan saldo.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 brutal-btn px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            + Buat Target Baru
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            const projection = buildGoalProjection(goal, monthlySavings);
            const remaining = projection.remaining;
            return (
              <div key={goal.id} className="border-b-2 border-neutral-100 pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-black text-lg text-black uppercase tracking-wider">{goal.title}</h4>
                    <p className="text-sm font-black text-neutral-600 mt-1">
                      {formatRupiah(goal.currentAmount)} / <span className="text-black">{formatRupiah(goal.targetAmount)}</span>
                      {remaining > 0 && <span className="text-neutral-400 font-bold"> • {formatRupiah(remaining)} left</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xl font-black ${progress >= 100 ? 'text-emerald-700' : 'text-black'}`}>
                      {progress.toFixed(1)}%
                    </span>
                    <button onClick={() => handleDelete(goal.id)} className="text-neutral-500 hover:text-red-650 hover:underline font-black text-xs uppercase tracking-wider cursor-pointer">
                      Delete
                    </button>
                  </div>
                </div>
                <div className="w-full bg-[#f3f4f6] border-[2px] border-black rounded-none h-4 mb-3 overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  <div className={`h-full rounded-none transition-all duration-500 border-r-[2px] border-black ${progress >= 100 ? 'bg-[#bbf7d0]' : 'bg-[#bfdbfe]'}`} style={{ width: `${progress}%` }}></div>
                </div>
                {editingId === goal.id ? (
                  <div className="flex gap-2 mt-3">
                    <input type="text" placeholder="Current Balance" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="flex-1 max-w-[150px] brutal-input text-xs py-1.5" autoFocus />
                    <button onClick={() => handleUpdateCurrent(goal.id)} disabled={loading} className="brutal-btn text-xs px-3 py-1.5 cursor-pointer">Update</button>
                    <button onClick={() => { setEditingId(null); setEditAmount(''); }} className="brutal-btn-light text-xs px-3 py-1.5 cursor-pointer">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => { setEditingId(goal.id); setEditAmount(goal.currentAmount.toString()); }} className="text-xs font-black text-neutral-500 hover:text-black transition-colors mt-1 underline uppercase tracking-wider cursor-pointer">
                    Update Progress
                  </button>
                )}

                <div className="mt-4 border-[2px] border-black bg-[#f8fafc] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-black" />
                        <h5 className="text-xs font-black uppercase tracking-wider text-black">Goal Projection</h5>
                      </div>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-neutral-600">
                        Estimasi dari surplus kas bulanan riil.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-right sm:min-w-[220px]">
                      <div className="border-[2px] border-black bg-white p-2 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Rata-rata</p>
                        <p className="text-xs font-black text-black">{formatRupiah(projection.avgMonthlySaving)}/bln</p>
                      </div>
                      <div className="border-[2px] border-black bg-white p-2 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Estimasi</p>
                        <p className="text-xs font-black text-black">
                          {projection.hasProjection
                            ? projection.isCompleted
                              ? 'Selesai'
                              : `${projection.monthsToComplete} bln`
                            : 'Butuh data'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={projection.chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid stroke="#d4d4d4" strokeDasharray="4 4" />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#171717', fontSize: 10, fontWeight: 800 }}
                          tickLine={false}
                          axisLine={{ stroke: '#000000', strokeWidth: 2 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fill: '#525252', fontSize: 10, fontWeight: 800 }}
                          tickFormatter={(value) => SHORT_RUPIAH_FORMATTER.format(Number(value || 0))}
                          tickLine={false}
                          axisLine={false}
                          width={56}
                        />
                        <Tooltip
                          contentStyle={{ background: '#ffffff', border: '3px solid #000000', borderRadius: '0px', fontSize: '11px', fontWeight: 'bold', boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)' }}
                          itemStyle={{ color: '#000000', fontWeight: '900' }}
                          formatter={(value: unknown, name: unknown) => [
                            formatRupiah(Number(value || 0)),
                            name === 'target' ? 'Target' : 'Proyeksi',
                          ]}
                        />
                        <Line type="monotone" dataKey="target" stroke="#a3a3a3" strokeWidth={2} dot={false} strokeDasharray="6 5" />
                        <Line type="monotone" dataKey="saved" stroke="#000000" strokeWidth={3} dot={{ r: 3, strokeWidth: 2, fill: '#bbf7d0', stroke: '#000000' }} activeDot={{ r: 5, strokeWidth: 2, fill: '#FFE066', stroke: '#000000' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`mt-4 border-[2px] border-black p-3 text-xs font-bold leading-relaxed text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] ${projection.hasProjection ? 'bg-[#bbf7d0]' : 'bg-[#fef08a]'}`}>
                    {projection.hasProjection && projection.completionDate ? (
                      projection.isCompleted ? (
                        <p>Target ini sudah tercapai. Pertahankan ritme tabungan Anda untuk goal berikutnya.</p>
                      ) : (
                        <div className="space-y-1">
                          <p>Dengan kecepatan saat ini, target diperkirakan tercapai pada {COMPLETION_FORMATTER.format(projection.completionDate)}.</p>
                          {projection.fasterByMonths > 0 && (
                            <p>Jika Anda menambah Rp500.000 per bulan, target dapat tercapai {projection.fasterByMonths} bulan lebih cepat.</p>
                          )}
                        </div>
                      )
                    ) : (
                      <p>Tambahkan minimal dua bulan transaksi dengan surplus positif agar Norden bisa menghitung estimasi selesai.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

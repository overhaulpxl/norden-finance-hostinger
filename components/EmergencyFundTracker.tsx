'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Lightbulb, Loader2, PiggyBank, ShieldCheck, Target } from 'lucide-react';
import { Balance, EmergencyFundPlan, Transaction } from '../types';
import { MIN_EMERGENCY_MONTHLY_EXPENSE } from '../lib/constants';
import { formatCoverageMonths, formatCurrency } from '../lib/format';
import { updateEmergencyFundPlan } from '../app/actions';

function estimateMonthlyExpense(transactions: Transaction[]) {
  const now = new Date();
  const monthTotals = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === 'keluar')
    .forEach((transaction) => {
      const date = new Date(transaction.transactionDate);
      const monthsAgo = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth();
      if (monthsAgo < 0 || monthsAgo > 2) return;

      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthTotals.set(key, (monthTotals.get(key) || 0) + transaction.amount);
    });

  const totals = Array.from(monthTotals.values()).filter((value) => value > 0);
  if (totals.length === 0) return 0;
  return Math.round(totals.reduce((sum, value) => sum + value, 0) / totals.length);
}

function parseCurrencyInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { state: 'empty' as const, value: null };

  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return { state: 'invalid' as const, value: null };

  const numericValue = Number(digits);
  if (!Number.isFinite(numericValue)) return { state: 'invalid' as const, value: null };
  if (numericValue === 0) return { state: 'zero' as const, value: 0 };
  return { state: 'valid' as const, value: numericValue };
}

function formatInputValue(value: number) {
  return value > 0 ? formatCurrency(value) : '';
}

export default function EmergencyFundTracker({
  transactions,
  balances,
  emergencyFundPlan,
}: {
  transactions: Transaction[];
  balances: Balance[];
  emergencyFundPlan: EmergencyFundPlan | null;
}) {
  const estimatedExpense = useMemo(() => estimateMonthlyExpense(transactions), [transactions]);
  const [savedMonthlyExpense, setSavedMonthlyExpense] = useState(() => emergencyFundPlan?.monthlyExpense || 0);
  const totalBalance = balances
    .filter((wallet) => !wallet.archivedAt)
    .reduce((sum, wallet) => sum + wallet.currentBalance, 0);
  const availableBalance = Math.max(0, totalBalance);
  const [input, setInput] = useState(() => formatInputValue(emergencyFundPlan?.monthlyExpense || 0));
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const parsedInput = parseCurrencyInput(input);
  const hasWalletBalance = balances.some((wallet) => !wallet.archivedAt && wallet.currentBalance !== 0);
  const hasExpenseData = savedMonthlyExpense > 0 || estimatedExpense > 0 || parsedInput.state !== 'empty';
  const calculationSource = savedMonthlyExpense > 0 ? 'saved' : estimatedExpense > 0 ? 'estimate' : 'manual';
  const monthlyExpense = savedMonthlyExpense > 0 ? savedMonthlyExpense : estimatedExpense;
  const isMonthlyExpenseRealistic = monthlyExpense >= MIN_EMERGENCY_MONTHLY_EXPENSE;
  const canCalculate = monthlyExpense > 0 && isMonthlyExpenseRealistic;
  const coverageMonths = canCalculate ? availableBalance / monthlyExpense : 0;
  const recommendationAvailable = !savedMonthlyExpense && estimatedExpense >= MIN_EMERGENCY_MONTHLY_EXPENSE;
  const lowInputWarning = parsedInput.state === 'valid' && parsedInput.value < MIN_EMERGENCY_MONTHLY_EXPENSE;

  const inputMessage = useMemo(() => {
    if (parsedInput.state === 'empty') return null;
    if (parsedInput.state === 'zero') return 'Masukkan pengeluaran bulanan terlebih dahulu.';
    if (parsedInput.state === 'invalid') return 'Nominal tidak valid.';
    if (lowInputWarning) return 'Masukkan pengeluaran bulanan yang realistis.';
    return null;
  }, [lowInputWarning, parsedInput.state]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseCurrencyInput(input);

    if (parsed.state === 'empty') {
      setStatus({ type: 'error', text: 'Masukkan pengeluaran bulanan terlebih dahulu.' });
      return;
    }

    if (parsed.state === 'zero') {
      setStatus({ type: 'error', text: 'Masukkan pengeluaran bulanan terlebih dahulu.' });
      return;
    }

    if (parsed.state !== 'valid' || parsed.value === null) {
      setStatus({ type: 'error', text: 'Nominal tidak valid.' });
      return;
    }

    if (parsed.value < MIN_EMERGENCY_MONTHLY_EXPENSE) {
      setStatus({ type: 'error', text: 'Masukkan pengeluaran bulanan yang realistis.' });
      return;
    }

    setSaving(true);
    setStatus(null);
    const result = await updateEmergencyFundPlan(parsed.value);
    setSaving(false);

    if (result.success) {
      setSavedMonthlyExpense(parsed.value);
      setInput(formatInputValue(parsed.value));
      setStatus({ type: 'success', text: 'Target dana darurat diperbarui.' });
    } else {
      setStatus({ type: 'error', text: result.error || 'Gagal menyimpan dana darurat.' });
    }
  }

  function useRecommendation() {
    if (!recommendationAvailable) return;
    setInput(formatInputValue(estimatedExpense));
    setStatus(null);
  }

  const targets = [3, 6, 12].map((months) => {
    const targetAmount = monthlyExpense * months;
    const progress = canCalculate && targetAmount > 0 ? Math.min(100, Math.max(0, (availableBalance / targetAmount) * 100)) : 0;
    const remaining = Math.max(0, targetAmount - availableBalance);
    return { months, targetAmount, progress, remaining };
  });

  return (
    <section className="brutal-card bg-white p-6 select-none">
      <div className="mb-6 grid gap-4 border-b-[3px] border-black pb-5 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-wider text-black">
            <ShieldCheck className="h-5 w-5 stroke-[3px]" />
            Emergency Fund
          </h3>
          <p className="mt-1 max-w-xl text-xs font-bold uppercase tracking-wide text-neutral-600">
            Dana darurat ideal dihitung dari pengeluaran bulanan Anda.
          </p>
          <p className="mt-2 max-w-xl text-xs font-bold leading-relaxed text-neutral-700">
            Dana darurat ideal dihitung dari 3, 6, dan 12 bulan pengeluaran hidup Anda.
          </p>
        </div>
        <div className="border-[3px] border-black bg-[#bbf7d0] px-4 py-3 text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:min-w-44 sm:text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-black">Coverage Dana Darurat</p>
          <p className="mt-1 text-2xl font-black text-black">{formatCoverageMonths(coverageMonths)}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-black">Coverage saat ini</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="grid gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Pengeluaran Bulanan</span>
          <input
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setStatus(null);
            }}
            onBlur={() => {
              const parsed = parseCurrencyInput(input);
              if (parsed.state === 'valid' && parsed.value !== null) setInput(formatInputValue(parsed.value));
            }}
            inputMode="numeric"
            className="brutal-input px-3 py-2 text-xs font-black"
            placeholder="Contoh: Rp 3.000.000"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="brutal-btn mt-auto min-h-11 px-4 text-xs disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PiggyBank className="h-4 w-4" />}
          Simpan
        </button>
      </form>

      {inputMessage && (
        <div className="mb-4 flex items-start gap-2 border-[2px] border-black bg-[#fef08a] p-3 text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 stroke-[3px]" />
          <span>{inputMessage}</span>
        </div>
      )}

      {recommendationAvailable && (
        <div className="mb-5 flex flex-col gap-3 border-[2px] border-black bg-[#e0f2fe] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 stroke-[3px] text-black" />
            <p className="text-xs font-black leading-relaxed text-black">
              Rata-rata pengeluaran bulanan Anda sekitar {formatCurrency(estimatedExpense)}. Gunakan nilai ini?
            </p>
          </div>
          <button type="button" onClick={useRecommendation} className="brutal-btn-light px-3 py-2 text-[10px]">
            Gunakan Rekomendasi
          </button>
        </div>
      )}

      {status && (
        <div className={`mb-5 border-[2px] border-black p-3 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200 ${
          status.type === 'success' ? 'bg-[#bbf7d0] text-black' : 'bg-[#fecaca] text-black'
        }`}>
          {status.text}
        </div>
      )}

      {!hasWalletBalance && !hasExpenseData ? (
        <div className="border-[3px] border-dashed border-black bg-white p-5 text-center">
          <p className="text-sm font-black uppercase tracking-wider text-black">
            Belum cukup data untuk menghitung dana darurat.
          </p>
          <p className="mt-2 text-xs font-bold leading-relaxed text-neutral-600">
            Tambahkan transaksi atau isi pengeluaran bulanan secara manual.
          </p>
        </div>
      ) : !canCalculate ? (
        <div className="border-[3px] border-dashed border-black bg-white p-5 text-center">
          <p className="text-sm font-black uppercase tracking-wider text-black">
            {monthlyExpense === 0 ? 'Masukkan pengeluaran bulanan terlebih dahulu.' : 'Masukkan pengeluaran bulanan yang realistis.'}
          </p>
          <p className="mt-2 text-xs font-bold leading-relaxed text-neutral-600">
            Target 3, 6, dan 12 bulan akan muncul setelah nominal pengeluaran valid.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-[2px] border-black bg-white p-3 text-xs font-bold leading-relaxed text-neutral-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Saldo Anda saat ini cukup untuk sekitar <span className="font-black text-black">{formatCoverageMonths(coverageMonths)}</span> pengeluaran.
            {calculationSource === 'estimate' ? ' Perhitungan memakai rata-rata pengeluaran 3 bulan terakhir.' : ''}
          </div>
          {targets.map((target) => (
            <div key={target.months} className="border-[2px] border-black bg-white p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 stroke-[3px] text-black" />
                  <span className="text-xs font-black uppercase tracking-widest text-black">Target {target.months} Bulan</span>
                </div>
                <span className="text-right text-sm font-black text-black">{formatCurrency(target.targetAmount)}</span>
              </div>
              <div className="mb-3 grid gap-2 text-xs font-bold text-neutral-700 sm:grid-cols-2">
                <p>
                  Saldo Saat Ini:<br />
                  <span className="font-black text-black">{formatCurrency(totalBalance)}</span>
                </p>
                <p className="sm:text-right">
                  Progress:<br />
                  <span className="font-black text-black">{target.progress.toFixed(1)}%</span>
                </p>
              </div>
              <div className="h-4 overflow-hidden border-[2px] border-black bg-[#f3f4f6]" aria-label={`Progress target ${target.months} bulan`}>
                <div
                  className={`h-full border-r-[2px] border-black transition-all duration-300 ${
                    target.progress >= 100 ? 'bg-[#bbf7d0]' : target.progress >= 50 ? 'bg-[#fef08a]' : 'bg-[#fecaca]'
                  }`}
                  style={{ width: `${target.progress}%` }}
                />
              </div>
              <div className="mt-3 flex items-start gap-2 text-xs font-black text-black">
                {target.progress >= 100 ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 stroke-[3px] text-emerald-700" />
                ) : (
                  <PiggyBank className="mt-0.5 h-4 w-4 shrink-0 stroke-[3px]" />
                )}
                <p>Status: {target.progress >= 100 ? 'Target tercapai' : `Masih perlu ${formatCurrency(target.remaining)}`}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

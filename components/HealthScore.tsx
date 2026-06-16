'use client';

import { Transaction, Balance, Debt } from '../types';
import { useMemo } from 'react';

export default function HealthScore({ transactions, balances, debts }: { transactions: Transaction[], balances: Balance[], debts: Debt[] }) {
  const { score, label, message, colorClass } = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      const d = new Date(t.transactionDate);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        if (t.type === 'masuk') income += t.amount;
        if (t.type === 'keluar') expense += t.amount;
      }
    });

    const totalBalance = balances.reduce((acc, curr) => acc + curr.currentBalance, 0);
    const totalDebt = debts.filter(d => d.type === 'hutang' && !d.isSettled).reduce((acc, curr) => acc + curr.amount, 0);

    // Savings Rate (30 points)
    const savingsRate = income > 0 ? (income - expense) / income : 0;
    let savingsScore = 0;
    if (savingsRate >= 0.20) savingsScore = 30;
    else if (savingsRate > 0) savingsScore = (savingsRate / 0.20) * 30;
    
    // Emergency Fund (40 points)
    const avgExpense = expense > 0 ? expense : 1000000;
    const emergencyMonths = totalBalance / avgExpense;
    const emergencyScore = Math.max(0, Math.min((emergencyMonths / 3) * 40, 40));

    // Debt-to-Balance Ratio (30 points)
    let debtScore = 30;
    if (totalDebt > 0) {
      if (totalBalance <= 0) debtScore = 0;
      else {
        const debtRatio = totalDebt / totalBalance;
        if (debtRatio > 0.5) debtScore = 0;
        else if (debtRatio > 0) debtScore = 30 - (debtRatio / 0.5) * 30;
      }
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(savingsScore + emergencyScore + debtScore)));

    let finalLabel = '';
    let finalMessage = '';
    let color = 'text-black';

    if (finalScore >= 80) {
      finalLabel = 'Sangat Sehat';
      finalMessage = 'Keuangan aman. Pertahankan gaya hidup ini.';
      color = 'text-emerald-700';
    } else if (finalScore >= 60) {
      finalLabel = 'Cukup Baik';
      finalMessage = 'Perlu tingkatkan tabungan darurat atau kurangi pengeluaran.';
      color = 'text-blue-700';
    } else if (finalScore >= 40) {
      finalLabel = 'Waspada';
      finalMessage = 'Pengeluaran hampir melebihi batas aman. Hati-hati utang.';
      color = 'text-amber-700';
    } else {
      finalLabel = 'Kritis';
      finalMessage = 'Segera pangkas pengeluaran non-esensial dan lunasi utang.';
      color = 'text-red-700';
    }

    if (income === 0 && totalBalance === 0 && expense === 0) {
      return { score: 0, label: 'Belum Ada Data', message: 'Mulai catat transaksi pertama Anda.', colorClass: 'text-neutral-400' };
    }

    return { score: finalScore, label: finalLabel, message: finalMessage, colorClass: color };
  }, [transactions, balances, debts]);

  return (
    <div className="brutal-card p-6 bg-white flex items-center gap-6 select-none">
      <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
          <path
            className="text-neutral-100"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeDasharray={`${score}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="square"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black text-black">{score}</span>
        </div>
      </div>
      <div>
        <h3 className="text-[10px] font-black text-neutral-500 mb-1 uppercase tracking-widest">Skor Kesehatan Finansial</h3>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`text-base font-black uppercase tracking-wider ${colorClass}`}>{label}</span>
        </div>
        <p className="text-xs text-neutral-600 font-bold leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

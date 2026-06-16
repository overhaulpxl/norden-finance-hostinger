'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Transaction, Balance, Debt, WishlistItem, Budget, AppSubscription, EmergencyFundPlan, SavingGoal, Achievement } from '../types';
import { formatRupiah } from '../lib/format';
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, Wallet, Scale } from 'lucide-react';
import { addCustomNotification } from '../app/actions/notifications';

function WidgetSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`brutal-card bg-white border-[3px] border-black p-6 ${className}`}>
      <div className="h-4 w-36 bg-neutral-200 border-2 border-black animate-pulse" />
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="h-16 bg-neutral-100 border-2 border-neutral-200 animate-pulse" />
        <div className="h-16 bg-neutral-100 border-2 border-neutral-200 animate-pulse" />
        <div className="h-16 bg-neutral-100 border-2 border-neutral-200 animate-pulse" />
      </div>
    </div>
  );
}

const MonthlyRecap = dynamic(() => import('./MonthlyRecap'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const HealthScore = dynamic(() => import('./HealthScore'), {
  ssr: false,
  loading: () => <WidgetSkeleton className="h-full min-h-[160px]" />,
});
const NoSpendCalendar = dynamic(() => import('./NoSpendCalendar'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const ExpenseChart = dynamic(() => import('./ExpenseChart'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const BudgetManager = dynamic(() => import('./BudgetManager'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const SubscriptionManager = dynamic(() => import('./SubscriptionManager'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const EmergencyFundTracker = dynamic(() => import('./EmergencyFundTracker'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const MomentumCenter = dynamic(() => import('./MomentumCenter'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});

interface OverviewProps {
  transactions: Transaction[];
  balances: Balance[];
  debts: Debt[];
  wishlist: WishlistItem[];
  savingGoals: SavingGoal[];
  budgets: Budget[];
  subscriptions: AppSubscription[];
  emergencyFundPlan: EmergencyFundPlan | null;
  achievements: Achievement[];
  user: {
    id: string;
    email: string;
    plan: 'trial' | 'pro';
    fullName?: string;
    trialEndsAt?: string | null;
  };
}

const DEFAULT_TOP_WIDGETS = [
  { id: 'total-balance', name: 'Total Balance', visible: true },
  { id: 'net-worth', name: 'Net Worth', visible: true },
  { id: 'health-score', name: 'Financial Health', visible: true },
];

const DEFAULT_WIDGETS = [
  { id: 'monthly-recap', name: 'Monthly Recap', visible: true, column: 'left' as const },
  { id: 'expense-chart', name: 'Expense Chart', visible: true, column: 'left' as const },
  { id: 'recent-transactions', name: 'Recent Transactions', visible: true, column: 'left' as const },
  { id: 'no-spend-calendar', name: 'No Spend Calendar', visible: true, column: 'right' as const },
  { id: 'momentum-center', name: 'Streaks & Reminders', visible: true, column: 'right' as const },
  { id: 'emergency-fund', name: 'Emergency Fund', visible: true, column: 'right' as const },
  { id: 'budget-manager', name: 'Budget Manager', visible: true, column: 'right' as const },
  { id: 'subscription-manager', name: 'Subscription Manager', visible: true, column: 'right' as const },
];

function readStoredWidgets<T extends Array<{ id: string }>>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const saved = window.localStorage.getItem(key);
    if (!saved) return fallback;

    const parsed = JSON.parse(saved) as T;
    const missingDefaults = fallback.filter((widget) => !parsed.some((savedWidget) => savedWidget.id === widget.id));
    return [...parsed, ...missingDefaults] as T;
  } catch {
    return fallback;
  }
}

export default function OverviewLayout({ 
  transactions, 
  balances, 
  debts, 
  budgets,
  subscriptions,
  emergencyFundPlan,
  savingGoals,
  achievements,
  user,
}: OverviewProps) {
  const totalBalance = balances.reduce((acc, curr) => acc + curr.currentBalance, 0);

  // Net Worth Calculation: Total Balance + Piutang - Utang
  const activePiutang = debts
    .filter(d => d.type === 'piutang' && !d.isSettled)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const activeUtang = debts
    .filter(d => d.type === 'hutang' && !d.isSettled)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netWorth = totalBalance + activePiutang - activeUtang;

  // Get recent 5 transactions
  const recentTransactions = [...transactions].sort((a, b) => 
    new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
  ).slice(0, 5);

  // All features are accessible for both trial and pro
  const isPro = true;

  // Layout customization state
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [topWidgets, setTopWidgets] = useState<typeof DEFAULT_TOP_WIDGETS>(() =>
    readStoredWidgets(`norden_top_widgets_${user.id}`, DEFAULT_TOP_WIDGETS)
  );
  const [columnWidgets, setColumnWidgets] = useState<typeof DEFAULT_WIDGETS>(() =>
    readStoredWidgets(`norden_column_widgets_${user.id}`, DEFAULT_WIDGETS)
  );

  const handleToggleCustomize = () => {
    if (isCustomizing) {
      setSuccess('Tata letak dashboard berhasil disimpan!');
      addCustomNotification(
        'Tata letak disimpan',
        'Anda berhasil menyesuaikan susunan widget dashboard Norden Finance Anda.',
        'LAYOUT_UPDATE'
      );
      setTimeout(() => setSuccess(null), 5000);
    }
    setIsCustomizing(!isCustomizing);
  };

  const handleToggleTopWidget = (id: string) => {
    const updated = topWidgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    setTopWidgets(updated);
    if (user?.id) {
      localStorage.setItem(`norden_top_widgets_${user.id}`, JSON.stringify(updated));
    }
  };

  const handleMoveTopWidget = (index: number, direction: 'up' | 'down') => {
    const updated = [...topWidgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < updated.length) {
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      setTopWidgets(updated);
      if (user?.id) {
        localStorage.setItem(`norden_top_widgets_${user.id}`, JSON.stringify(updated));
      }
    }
  };

  const handleToggleColumnWidget = (id: string) => {
    const updated = columnWidgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    setColumnWidgets(updated);
    if (user?.id) {
      localStorage.setItem(`norden_column_widgets_${user.id}`, JSON.stringify(updated));
    }
  };

  const handleMoveColumnWidget = (index: number, direction: 'up' | 'down') => {
    const updated = [...columnWidgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < updated.length) {
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      setColumnWidgets(updated);
      if (user?.id) {
        localStorage.setItem(`norden_column_widgets_${user.id}`, JSON.stringify(updated));
      }
    }
  };

  const handleSwitchColumnWidget = (id: string) => {
    const updated = columnWidgets.map(w => w.id === id ? { ...w, column: w.column === 'left' ? 'right' as const : 'left' as const } : w);
    setColumnWidgets(updated);
    if (user?.id) {
      localStorage.setItem(`norden_column_widgets_${user.id}`, JSON.stringify(updated));
    }
  };

  const handleResetLayout = () => {
    setTopWidgets(DEFAULT_TOP_WIDGETS);
    setColumnWidgets(DEFAULT_WIDGETS);
    if (user?.id) {
      localStorage.removeItem(`norden_top_widgets_${user.id}`);
      localStorage.removeItem(`norden_column_widgets_${user.id}`);
    }
    setSuccess('Tata letak dashboard dikembalikan ke default!');
    addCustomNotification(
      'Tata letak direset',
      'Susunan widget dashboard telah dikembalikan ke pengaturan awal pabrik.',
      'LAYOUT_RESET'
    );
    setTimeout(() => setSuccess(null), 5000);
  };

  const renderColumnWidget = (id: string) => {
    switch (id) {
      case 'monthly-recap':
        return <MonthlyRecap key={id} transactions={transactions} />;
      case 'expense-chart':
        return <ExpenseChart key={id} transactions={transactions} />;
      case 'recent-transactions':
        return (
          <div key={id} className="brutal-card p-6 flex flex-col bg-white border-[3px] border-black">
            <div className="flex justify-between items-center mb-6 border-b-[3px] border-black pb-4">
              <h3 className="text-lg font-black text-black uppercase tracking-wider">Recent Transactions</h3>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-6 text-neutral-400 font-bold text-sm uppercase tracking-wider">
                Belum ada transaksi. Gunakan input cepat untuk mencatat!
              </div>
            ) : (
              <div className="space-y-1">
                {recentTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-3 border-b-2 border-neutral-100 last:border-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-9 h-9 border-2 border-black rounded-none flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                        t.type === 'masuk' ? 'bg-[#bbf7d0] text-black' : 
                        t.type === 'transfer' ? 'bg-[#bfdbfe] text-black' : 
                        'bg-[#fecaca] text-black'
                      }`}>
                        {t.type === 'masuk' ? <ArrowDownRight className="w-4 h-4 stroke-[3px]" /> : 
                         t.type === 'transfer' ? <ArrowRightLeft className="w-4 h-4 stroke-[3px]" /> : 
                         <ArrowUpRight className="w-4 h-4 stroke-[3px]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-black uppercase tracking-wider truncate">{t.category?.name || 'Lain-lain'}</p>
                        <p className="text-xs font-semibold text-neutral-400 capitalize truncate mt-0.5">{t.note || t.wallet?.name || 'Lain-lain'}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className={`text-sm font-black block tracking-wider ${
                        t.type === 'masuk' ? 'text-emerald-700' : 
                        t.type === 'transfer' ? 'text-blue-700' : 
                        'text-black'
                      }`}>
                        {t.type === 'masuk' ? '+' : t.type === 'transfer' ? '' : '-'}{formatRupiah(t.amount)}
                      </span>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                        {new Date(t.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'no-spend-calendar':
        return <NoSpendCalendar key={id} transactions={transactions} />;
      case 'budget-manager':
        return <BudgetManager key={id} budgets={budgets} transactions={transactions} isPro={isPro} />;
      case 'subscription-manager':
        return <SubscriptionManager key={id} subscriptions={subscriptions} balances={balances} isPro={isPro} />;
      case 'emergency-fund':
        return <EmergencyFundTracker key={id} transactions={transactions} balances={balances} emergencyFundPlan={emergencyFundPlan} />;
      case 'momentum-center':
        return <MomentumCenter key={id} transactions={transactions} balances={balances} budgets={budgets} subscriptions={subscriptions} savingGoals={savingGoals} emergencyFundPlan={emergencyFundPlan} achievements={achievements} trialEndsAt={user.trialEndsAt} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Layout Customize Action Bar */}
      <div className="flex justify-end">
        <button 
          onClick={handleToggleCustomize}
          className="brutal-btn flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-[#FFE066] text-black border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
        >
          {isCustomizing ? '💾 SELESAI & SIMPAN' : '⚙️ SESUAIKAN LAYOUT'}
        </button>
      </div>

      {success && (
        <div className="p-3 border-[2px] border-black bg-[#bbf7d0] text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {isCustomizing && (
        <div className="brutal-card p-6 bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-black">⚙️ KUSTOMISASI TATA LETAK DASHBOARD</h3>
            <button 
              onClick={handleResetLayout}
              className="px-3 py-1 text-[10px] font-black uppercase bg-[#fecaca] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              🔄 Default
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Top Cards Config */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 mb-3">KARTU METRIK UTAMA (ATAS)</h4>
              <div className="space-y-2">
                {topWidgets.map((widget, index) => (
                  <div key={widget.id} className="flex items-center justify-between p-3 border-2 border-black bg-[#FAF9F5] text-xs font-bold uppercase">
                    <span className="flex items-center gap-2">
                      <span className="text-neutral-400 font-mono">#{index + 1}</span>
                      {widget.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleToggleTopWidget(widget.id)}
                        title={widget.visible ? "Sembunyikan" : "Tampilkan"}
                        className={`p-1.5 border border-black transition-colors ${widget.visible ? 'bg-[#bbf7d0] hover:bg-[#86efac]' : 'bg-[#fecaca] hover:bg-[#fca5a5]'}`}
                      >
                        {widget.visible ? '👁️' : '❌'}
                      </button>
                      <button 
                        disabled={index === 0}
                        onClick={() => handleMoveTopWidget(index, 'up')}
                        className="p-1.5 border border-black bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-white"
                      >
                        ↑
                      </button>
                      <button 
                        disabled={index === topWidgets.length - 1}
                        onClick={() => handleMoveTopWidget(index, 'down')}
                        className="p-1.5 border border-black bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-white"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Main Widgets Config */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 mb-3">WIDGET KONTEN DASHBOARD</h4>
              <div className="space-y-2">
                {columnWidgets.map((widget, index) => (
                  <div key={widget.id} className="flex items-center justify-between p-3 border-2 border-black bg-[#FAF9F5] text-xs font-bold uppercase">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-black text-black">{widget.name}</span>
                      <span className="text-[9px] text-neutral-400 tracking-wider">
                        KOLOM: {widget.column === 'left' ? 'KIRI (LEBAR)' : 'KANAN (SEMPIT)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Toggle Visibility */}
                      <button 
                        onClick={() => handleToggleColumnWidget(widget.id)}
                        title={widget.visible ? "Sembunyikan" : "Tampilkan"}
                        className={`p-1.5 border border-black transition-colors ${widget.visible ? 'bg-[#bbf7d0] hover:bg-[#86efac]' : 'bg-[#fecaca] hover:bg-[#fca5a5]'}`}
                      >
                        {widget.visible ? '👁️' : '❌'}
                      </button>
                      {/* Move Up */}
                      <button 
                        disabled={index === 0}
                        onClick={() => handleMoveColumnWidget(index, 'up')}
                        className="p-1.5 border border-black bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-white"
                      >
                        ↑
                      </button>
                      {/* Move Down */}
                      <button 
                        disabled={index === columnWidgets.length - 1}
                        onClick={() => handleMoveColumnWidget(index, 'down')}
                        className="p-1.5 border border-black bg-white hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-white"
                      >
                        ↓
                      </button>
                      {/* Switch Column */}
                      <button 
                        onClick={() => handleSwitchColumnWidget(widget.id)}
                        title="Pindah Kolom"
                        className="p-1.5 border border-black bg-[#bfdbfe] hover:bg-[#93c5fd]"
                      >
                        ⇆
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {topWidgets
          .filter(w => w.visible)
          .map(w => {
            if (w.id === 'total-balance') {
              return (
                <div key={w.id} className="brutal-card p-6 bg-black text-white flex flex-col justify-between border-[3px] border-black">
                  <div>
                    <p className="text-xs font-black text-[#bbf7d0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4" /> Total Balance
                    </p>
                    <h2 className="text-3xl xl:text-4xl font-black text-white truncate">{formatRupiah(totalBalance)}</h2>
                  </div>
                  <p className="text-[10px] font-bold text-neutral-400 mt-4 uppercase tracking-wider">
                    Saldo gabungan dari {balances.length} dompet aktif
                  </p>
                </div>
              );
            }
            if (w.id === 'net-worth') {
              return (
                <div key={w.id} className="brutal-card p-6 bg-white text-black flex flex-col justify-between border-[3px] border-black">
                  <div>
                    <p className="text-xs font-black text-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Scale className="w-4 h-4" /> Net Worth
                    </p>
                    <h2 className={`text-3xl xl:text-4xl font-black truncate ${netWorth >= 0 ? 'text-black' : 'text-red-600'}`}>
                      {formatRupiah(netWorth)}
                    </h2>
                  </div>
                  <div className="text-[10px] font-bold text-black mt-4 flex justify-between uppercase tracking-wider border-t-2 border-black pt-3">
                    <span>Utang: {formatRupiah(activeUtang)}</span>
                    <span>Piutang: {formatRupiah(activePiutang)}</span>
                  </div>
                </div>
              );
            }
            if (w.id === 'health-score') {
              return (
                <div key={w.id} className="md:col-span-2 lg:col-span-1">
                  <HealthScore transactions={transactions} balances={balances} debts={debts} />
                </div>
              );
            }
            return null;
          })}
      </div>

      {/* Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Wider) */}
        <div className="lg:col-span-2 space-y-6">
          {columnWidgets
            .filter(w => w.column === 'left' && w.visible)
            .map(w => renderColumnWidget(w.id))}
        </div>
        
        {/* Right Column (Narrower) */}
        <div className="space-y-6">
          {columnWidgets
            .filter(w => w.column === 'right' && w.visible)
            .map(w => renderColumnWidget(w.id))}
        </div>
      </div>
    </div>
  );
}

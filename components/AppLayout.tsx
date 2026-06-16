'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Transaction, Balance, SavingGoal, Debt, WishlistItem, Paylater, Budget, AppSubscription, EmergencyFundPlan, TransactionTemplate, RecurringTransaction, Reminder, Achievement } from '../types';
import Sidebar from './Sidebar';
import OverviewLayout from './OverviewLayout';
import { Menu } from 'lucide-react';
import WelcomeToast from './WelcomeToast';

function PanelSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`brutal-card bg-white border-[3px] border-black p-6 ${className}`}>
      <div className="h-4 w-40 bg-neutral-200 border-2 border-black animate-pulse" />
      <div className="mt-5 space-y-3">
        <div className="h-3 w-full bg-neutral-100 border border-neutral-200 animate-pulse" />
        <div className="h-3 w-5/6 bg-neutral-100 border border-neutral-200 animate-pulse" />
        <div className="h-3 w-2/3 bg-neutral-100 border border-neutral-200 animate-pulse" />
      </div>
    </div>
  );
}

const BalanceCards = dynamic(() => import('./BalanceCards'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const SavingGoals = dynamic(() => import('./SavingGoals'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const DebtList = dynamic(() => import('./DebtList'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const Wishlist = dynamic(() => import('./Wishlist'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const TransactionTable = dynamic(() => import('./TransactionTable'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const MonthlyRecap = dynamic(() => import('./MonthlyRecap'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const ExpenseChart = dynamic(() => import('./ExpenseChart'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const QuickInputModal = dynamic(() => import('./QuickInputModal'), {
  ssr: false,
  loading: () => null,
});
const PaylaterList = dynamic(() => import('./PaylaterList'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const Integrations = dynamic(() => import('./Integrations'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const SettingsPage = dynamic(() => import('./SettingsPage'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const HelpPage = dynamic(() => import('./HelpPage'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const AutomationCenter = dynamic(() => import('./AutomationCenter'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const FinancialTimeline = dynamic(() => import('./FinancialTimeline'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const NotificationCenter = dynamic(() => import('./NotificationCenter'), {
  ssr: false,
  loading: () => (
    <div className="h-10 w-10 border-[2px] border-black bg-white shadow-[2px_2px_0px_0px_#000] animate-pulse" />
  ),
});
const NextGenIntelligence = dynamic(() => import('./NextGenIntelligence'), {
  ssr: false,
  loading: () => <PanelSkeleton className="min-h-[320px]" />,
});

interface AppLayoutProps {
  user: {
    id: string;
    email: string;
    plan: 'trial' | 'pro';
    fullName?: string;
    trialEndsAt?: string | null;
    role?: string;
  };
  transactions: Transaction[];
  balances: Balance[];
  savingGoals: SavingGoal[];
  debts: Debt[];
  wishlist: WishlistItem[];
  paylaters: Paylater[];
  budgets: Budget[];
  subscriptions: AppSubscription[];
  emergencyFundPlan: EmergencyFundPlan | null;
  templates: TransactionTemplate[];
  recurringTransactions: RecurringTransaction[];
  reminders: Reminder[];
  achievements: Achievement[];
  trialDays: number;
  pricingPlans: {
    monthly: { price: number; name: string } | null;
    yearly: { price: number; name: string } | null;
  };
  dataError?: string | null;
}

export default function AppLayout({ 
  user,
  transactions, 
  balances, 
  savingGoals, 
  debts, 
  wishlist, 
  paylaters,
  budgets,
  subscriptions,
  emergencyFundPlan,
  templates,
  recurringTransactions,
  reminders,
  achievements,
  trialDays,
  pricingPlans,
  dataError
}: AppLayoutProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'goals' | 'history' | 'automation' | 'reports' | 'settings' | 'help' | 'integrations'>('overview');
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const levelInfo = (() => {
    const txCount = transactions.length;
    const budgetCount = budgets.length;
    const goalCount = savingGoals.length;
    if (txCount >= 100 && goalCount >= 1) return { level: 5, name: 'Financial Navigator', color: 'bg-[#c084fc]' }; // purple
    if (txCount >= 50 && budgetCount >= 2) return { level: 4, name: 'Budget Master', color: 'bg-[#4ade80]' }; // green
    if (txCount >= 20 && (budgetCount >= 1 || goalCount >= 1)) return { level: 3, name: 'Smart Planner', color: 'bg-[#facc15]' }; // yellow
    if (txCount >= 5) return { level: 2, name: 'Consistent Tracker', color: 'bg-[#60a5fa]' }; // blue
    return { level: 1, name: 'Beginner Saver', color: 'bg-[#a3a3a3]' }; // gray
  })();

  return (
    <div className="flex min-h-screen bg-[#FAF9F5]" style={{ backgroundImage: 'radial-gradient(#d1d1d1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <WelcomeToast userId={user.id} fullName={user.fullName} />
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar user={user} activeTab={activeTab} setActiveTab={handleTabChange} onNewTransaction={() => { setShowModal(true); setSidebarOpen(false); }} levelInfo={levelInfo} />
      </div>
      
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 min-w-0">
        <header className="flex justify-between items-center mb-6 lg:mb-8 border-b-[3px] border-black pb-4 select-none">
          {/* Mobile hamburger */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-none border-[2px] border-black bg-white p-2 shadow-[2px_2px_0px_0px_#000] transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Menu className="w-5 h-5 text-slate-800" />
            </button>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wider text-black">
              {activeTab === 'goals' ? 'Goals & Debts' : 
               activeTab === 'automation' ? 'Automation' :
               activeTab === 'reports' ? 'Data Dashboard' : 
               activeTab === 'overview' ? 'Home' : 
               activeTab}
            </h2>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Level and PRO badge (Desktop only) */}
            <div className="hidden sm:flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${levelInfo.color}`}>
                Lvl {levelInfo.level}: {levelInfo.name}
              </span>
              {user.plan === 'pro' && (
                <span className="bg-[#FFE066] text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                  👑 PRO
                </span>
              )}
            </div>

            <NotificationCenter />

            <button 
              onClick={() => setShowModal(true)}
              className="brutal-btn px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              + New
            </button>
          </div>
        </header>

        {dataError && (
          <div className="mb-6 border-[3px] border-black bg-[#ffccd5] p-4 text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] rounded-none">
            {dataError}
          </div>
        )}

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'overview' && (
            <OverviewLayout 
              user={user}
              transactions={transactions} 
              balances={balances} 
              debts={debts} 
              wishlist={wishlist} 
              savingGoals={savingGoals}
              budgets={budgets}
              subscriptions={subscriptions}
              emergencyFundPlan={emergencyFundPlan}
              achievements={achievements}
            />
          )}

          {activeTab === 'wallet' && (
            <BalanceCards balances={balances} />
          )}

          {activeTab === 'goals' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Wishlist items={wishlist} balances={balances} />
                <SavingGoals goals={savingGoals} transactions={transactions} />
              </div>
              <div className="space-y-6">
                <PaylaterList paylaters={paylaters} balances={balances} />
                <DebtList debts={debts} />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="brutal-card p-4 sm:p-6 bg-white">
                <TransactionTable transactions={transactions} balances={balances} />
              </div>
              <FinancialTimeline transactions={transactions} />
            </div>
          )}

          {activeTab === 'automation' && (
            <AutomationCenter
              templates={templates}
              recurringTransactions={recurringTransactions}
              reminders={reminders}
              balances={balances}
            />
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <NextGenIntelligence
                transactions={transactions}
                balances={balances}
                budgets={budgets}
                subscriptions={subscriptions}
                savingGoals={savingGoals}
                debts={debts}
                paylaters={paylaters}
                achievements={achievements}
              />
              <div className="brutal-card bg-white p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">Exports & Reports</h3>
                    <p className="text-sm text-slate-500">Download data transaksi dan laporan bulanan.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href="/api/export?format=csv" className="brutal-btn-light min-h-11 text-sm">CSV</a>
                    <a href="/api/export?format=json" className="brutal-btn-light min-h-11 text-sm">JSON</a>
                    <a href="/api/export?format=pdf" className="brutal-btn min-h-11 text-sm">PDF Report</a>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MonthlyRecap transactions={transactions} />
                <ExpenseChart transactions={transactions} />
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsPage 
              user={user}
              trialDays={trialDays}
              pricingPlans={pricingPlans}
              stats={{
                transactionCount: transactions.length,
                walletCount: balances.length,
                balanceTotal: balances.reduce((a, b) => a + b.currentBalance, 0),
              }}
            />
          )}

          {activeTab === 'help' && (
            <div className="brutal-card p-4 sm:p-6 bg-white">
              <HelpPage />
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="brutal-card p-4 sm:p-6 bg-white">
              <Integrations />
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <QuickInputModal
          balances={balances}
          onClose={() => setShowModal(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}

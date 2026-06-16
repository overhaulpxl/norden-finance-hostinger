'use client';

import { useState } from 'react';
import { Transaction, Balance, SavingGoal, Debt } from '../types';
import QuickInput from './QuickInput';
import SummaryCards from './SummaryCards';
import BalanceCards from './BalanceCards';
import TransactionTable from './TransactionTable';
import ExpenseChart from './ExpenseChart';
import SavingGoals from './SavingGoals';
import MonthlyRecap from './MonthlyRecap';
import DebtList from './DebtList';
import HealthScore from './HealthScore';
import NoSpendCalendar from './NoSpendCalendar';
import Wishlist from './Wishlist';
import { WishlistItem, Paylater } from '../types';
import PaylaterList from './PaylaterList';
import Integrations from './Integrations';

interface DashboardTabsProps {
  transactions: Transaction[];
  balances: Balance[];
  savingGoals: SavingGoal[];
  debts: Debt[];
  wishlist: WishlistItem[];
  paylaters: Paylater[];
}

export default function DashboardTabs({ transactions, balances, savingGoals, debts, wishlist, paylaters }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'goals' | 'history' | 'integrations'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'wallet', label: 'Dompet' },
    { id: 'goals', label: 'Target, Utang & Cicilan' },
    { id: 'history', label: 'Riwayat' },
    { id: 'integrations', label: 'Integrations (NFC)' },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-neutral-800 w-full overflow-x-auto hide-scrollbar">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                isActive 
                  ? 'border-neutral-200 text-neutral-100' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <QuickInput />
            <HealthScore transactions={transactions} balances={balances} debts={debts} />
            <SummaryCards transactions={transactions} balances={balances} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExpenseChart transactions={transactions} />
              <MonthlyRecap transactions={transactions} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NoSpendCalendar transactions={transactions} />
              {/* Optional: Add something else here in the future to balance the grid */}
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <BalanceCards balances={balances} />
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Wishlist items={wishlist} />
              <SavingGoals goals={savingGoals} transactions={transactions} />
            </div>
            <div className="space-y-6">
              <PaylaterList paylaters={paylaters} />
              <DebtList debts={debts} />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <TransactionTable transactions={transactions} />
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <Integrations />
          </div>
        )}
      </div>
    </div>
  );
}

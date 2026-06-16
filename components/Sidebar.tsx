'use client';

import { Home, Wallet, Target, History, Plus, FileText, Settings, HelpCircle, LogOut, Zap, Shield, Repeat2 } from 'lucide-react';
import React, { useTransition } from 'react';
import { logoutAction } from '../app/authActions';
import Link from 'next/link';
import BrandLogo from './BrandLogo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: SidebarTab) => void;
  onNewTransaction: () => void;
  user: {
    email: string;
    plan: 'trial' | 'pro';
    fullName?: string;
    trialEndsAt?: string | null;
    role?: string;
  };
  levelInfo: {
    level: number;
    name: string;
    color: string;
  };
}

type SidebarTab = 'overview' | 'wallet' | 'goals' | 'history' | 'automation' | 'reports' | 'settings' | 'help' | 'integrations';

export default function Sidebar({ activeTab, setActiveTab, onNewTransaction, user, levelInfo }: SidebarProps) {
  const [isPending, startTransition] = useTransition();
  const [now] = React.useState(() => Date.now());

  const menuItems = [
    { id: 'overview', label: 'Home', icon: Home },
    { id: 'wallet', label: 'Wallets', icon: Wallet },
    { id: 'goals', label: 'Goals & Debts', icon: Target },
    { id: 'history', label: 'Transactions', icon: History },
    { id: 'automation', label: 'Automation', icon: Repeat2 },
  ] as const;

  const secondaryItems: Array<{ id: SidebarTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'reports', label: 'Data Dashboard', icon: FileText },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

  const [confirmLogout, setConfirmLogout] = React.useState(false);

  function handleLogout() {
    if (!confirmLogout) {
      setConfirmLogout(true);
      setTimeout(() => setConfirmLogout(false), 3000);
      return;
    }
    startTransition(async () => {
      const res = await logoutAction();
      if (res.success) {
        window.location.href = '/login';
      }
    });
  }

  // Calculate trial days remaining
  const trialDaysLeft = user.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <aside className="w-64 bg-[#FAF9F5] text-black border-r-[3px] border-black h-screen fixed left-0 top-0 flex flex-col pt-6 pb-6 z-10 select-none">
      {/* Logo */}
      <div className="px-6 mb-8">
        <BrandLogo variant="horizontal" priority className="h-12 w-auto" />
      </div>

      {/* CTA Button */}
      <div className="px-6 mb-8">
        <button 
          onClick={onNewTransaction}
          className="w-full bg-[#FFE066] text-black border-[2.5px] border-black font-black uppercase text-xs py-3 shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all rounded-none cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          New Transaction
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-2.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-none text-xs font-bold uppercase tracking-wider transition-all border-[2px] cursor-pointer ${
                isActive 
                  ? 'bg-black text-white border-black shadow-[3px_3px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]' 
                  : 'text-neutral-700 border-transparent hover:bg-neutral-200/50 hover:text-black'
              }`}
            >
              <item.icon className={`w-4.5 h-4.5 stroke-[2.5px] ${isActive ? 'text-[#2ECC71]' : 'text-neutral-500'}`} />
              {item.label}
            </button>
          );
        })}

        <div className="pt-6 pb-2">
          <p className="px-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest">Other</p>
        </div>
        
        {secondaryItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-none text-xs font-bold uppercase tracking-wider transition-all border-[2px] cursor-pointer ${
                isActive 
                  ? 'bg-black text-white border-black shadow-[3px_3px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]' 
                  : 'text-neutral-700 border-transparent hover:bg-neutral-200/50 hover:text-black'
              }`}
            >
              <item.icon className={`w-4.5 h-4.5 stroke-[2.5px] ${isActive ? 'text-[#2ECC71]' : 'text-neutral-500'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Trial Banner */}
      {user.plan === 'trial' && trialDaysLeft !== null && (
        <div className="px-4 mb-3">
          <div className="p-3 bg-white border-[2px] border-black rounded-none shadow-[3px_3px_0px_0px_#000] text-center">
            <p className="text-[10px] font-black text-[#FF6B6B] uppercase tracking-wider">Trial</p>
            <p className="text-sm font-black text-black mt-0.5">{trialDaysLeft} hari tersisa</p>
            <a href="/upgrade" className="text-[10px] font-black text-black underline hover:text-neutral-800 transition-colors mt-1.5 block">
              Upgrade ke Pro
            </a>
          </div>
        </div>
      )}

      {/* Admin Panel Link */}
      {user.role === 'admin' && (
        <div className="px-4 mb-3">
          <Link 
            href="/norden-control-center" 
            className="w-full flex items-center justify-center gap-2 py-2.5 border-[2px] border-black bg-[#FFE066] hover:bg-[#ffd533] text-black font-black uppercase text-xs rounded-none shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer text-center"
          >
            <Shield className="w-4 h-4 stroke-[2.5px] text-black" />
            Admin Panel
          </Link>
        </div>
      )}

      {/* User Profile */}
      <div className="px-4 mt-auto">
        <div className="p-3 border-[2.5px] border-black rounded-none bg-white shadow-[3px_3px_0px_0px_#000] flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none border-[1.5px] border-black bg-[#2ECC71] flex items-center justify-center text-black font-black text-xs shrink-0">
              {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-black truncate leading-tight uppercase tracking-wider">{user.fullName || 'User'}</p>
              <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-wide truncate mt-0.5">Lvl {levelInfo.level}: {levelInfo.name}</p>
              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-none border border-black inline-block mt-1 leading-none ${
                user.plan === 'pro' ? 'bg-[#FFE066] text-black' : 'bg-neutral-200 text-neutral-600'
              }`}>
                {user.plan === 'pro' ? 'PRO 👑' : 'TRIAL ⚡'}
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            disabled={isPending}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 border-[2px] border-black rounded-none text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50 mt-1 cursor-pointer bg-black text-white hover:bg-neutral-800`}
          >
            <LogOut className="w-3.5 h-3.5 stroke-[2.5px]" />
            {isPending ? 'Keluar...' : confirmLogout ? 'Ulangi klik' : 'Keluar Akun'}
          </button>
        </div>
      </div>
    </aside>
  );
}

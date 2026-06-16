'use client';

import { Transaction } from '../types';

export default function NoSpendCalendar({ transactions }: { transactions: Transaction[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  
  // Find which days have 'keluar' transactions
  const spendDays = new Set<number>();
  transactions.forEach(t => {
    const d = new Date(t.transactionDate);
    if (d.getFullYear() === year && d.getMonth() === month && t.type === 'keluar') {
      spendDays.add(d.getDate());
    }
  });

  return (
    <div className="brutal-card p-6 bg-white select-none">
      <div className="flex justify-between items-center mb-6 border-b-[3px] border-black pb-4">
        <h3 className="text-lg font-black text-black uppercase tracking-wider">No-Spend Tracker</h3>
        <span className="text-[10px] font-black text-black bg-[#bbf7d0] border-[2px] border-black px-3 py-1 rounded-none uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {daysInMonth - spendDays.size} Hari Hemat
        </span>
      </div>
      
      <div className="grid grid-cols-7 gap-1.5">
        {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((d, i) => (
          <div key={i} className="text-[10px] text-center text-black mb-1 font-black uppercase">{d}</div>
        ))}
        
        {blanks.map(b => (
          <div key={`blank-${b}`} className="aspect-square rounded-none"></div>
        ))}
        
        {days.map(day => {
          const isSpend = spendDays.has(day);
          const isToday = day === today.getDate();
          const isFuture = day > today.getDate();
          
          let bgClasses = '';
          if (isFuture) bgClasses = 'bg-[#f3f4f6] border border-neutral-300 opacity-40 text-neutral-400';
          else if (isSpend) bgClasses = 'bg-neutral-100 border border-neutral-300 text-neutral-400';
          else bgClasses = 'bg-[#bbf7d0] border-[2px] border-black text-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';

          return (
            <div 
              key={day} 
              title={isFuture ? 'Future' : isSpend ? 'Spent money' : 'No spend day! 🎉'}
              className={`aspect-square flex items-center justify-center text-xs rounded-none transition-transform ${bgClasses} ${
                isToday ? 'ring-[3px] ring-black border-2 border-black scale-105 z-10 font-black' : ''
              }`}
            >
              <span>{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { Transaction } from '../types';
import { formatRupiah } from '../lib/format';
import { ArrowDownRight, ArrowRightLeft, ArrowUpRight, CalendarDays } from 'lucide-react';

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function FinancialTimeline({ transactions }: { transactions: Transaction[] }) {
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, transaction) => {
    const key = monthKey(new Date(transaction.transactionDate));
    acc[key] = acc[key] || [];
    acc[key].push(transaction);
    return acc;
  }, {});

  const months = Object.entries(grouped)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12);

  return (
    <section className="brutal-card bg-white p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3 border-b-[3px] border-black pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-black uppercase tracking-wider text-black">
            <CalendarDays className="h-5 w-5 stroke-[3px]" />
            Financial Timeline
          </h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
            Riwayat bulanan dari transaksi, dompet, kategori, dan tag.
          </p>
        </div>
      </div>

      {months.length === 0 ? (
        <div className="border-[3px] border-dashed border-black bg-white p-6 text-center text-xs font-black uppercase tracking-wider text-neutral-500">
          Timeline akan muncul setelah transaksi pertama dicatat.
        </div>
      ) : (
        <div className="space-y-6">
          {months.map(([key, items]) => {
            const monthDate = new Date(`${key}-01T12:00:00`);
            const income = items.filter((item) => item.type === 'masuk').reduce((sum, item) => sum + item.amount, 0);
            const expense = items.filter((item) => item.type === 'keluar').reduce((sum, item) => sum + item.amount, 0);
            const net = income - expense;

            return (
              <div key={key} className="grid gap-3 border-l-[3px] border-black pl-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-black">
                      {monthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      {items.length} transaksi, net {formatRupiah(net)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-wider">
                    <span className="border-[2px] border-black bg-[#bbf7d0] px-2 py-1 text-black">In {formatRupiah(income)}</span>
                    <span className="border-[2px] border-black bg-[#fecaca] px-2 py-1 text-black">Out {formatRupiah(expense)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {items.slice(0, 8).map((transaction) => {
                    const Icon = transaction.type === 'masuk' ? ArrowDownRight : transaction.type === 'transfer' ? ArrowRightLeft : ArrowUpRight;
                    const tags = transaction.tags || [];
                    return (
                      <div key={transaction.id} className="flex items-center justify-between gap-3 border-[2px] border-black bg-white p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Icon className="h-4 w-4 flex-shrink-0 stroke-[3px] text-black" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black uppercase tracking-wider text-black">
                              {transaction.note || transaction.category?.name || 'Transaksi'}
                            </p>
                            <p className="truncate text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                              {transaction.wallet?.name || '-'} {tags.length ? `#${tags.join(' #')}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="flex-shrink-0 text-xs font-black text-black">{formatRupiah(transaction.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

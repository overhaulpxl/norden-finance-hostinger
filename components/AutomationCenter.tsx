'use client';

import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarClock, Check, Loader2, Play, Plus, Star, Trash2 } from 'lucide-react';
import type { Balance, Reminder, RecurringTransaction, TransactionTemplate, TransactionType } from '../types';
import { formatRupiah } from '../lib/format';
import WalletSelect, { getActiveWallets } from './WalletSelect';
import {
  addRecurringRule,
  addReminder,
  completeReminder,
  deleteRecurringRule,
  deleteReminder,
  deleteTransactionTemplate,
  toggleRecurringRule,
  toggleTemplateFavorite,
  upsertTransactionTemplate,
  useTransactionTemplate as runTransactionTemplate,
} from '../app/actions';

type ActionResult = { success: boolean; error?: string };

function splitTags(value: string) {
  return value
    .split(/\s+/)
    .map((tag) => tag.replace(/^#/, '').trim())
    .filter(Boolean);
}

function toNumber(value: string) {
  return parseInt(value.replace(/\D/g, ''), 10) || 0;
}

function todayInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export default function AutomationCenter({
  templates,
  recurringTransactions,
  reminders,
  balances = [],
}: {
  templates: TransactionTemplate[];
  recurringTransactions: RecurringTransaction[];
  reminders: Reminder[];
  balances?: Balance[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<TransactionType>('keluar');
  const [templateAmount, setTemplateAmount] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateWallet, setTemplateWallet] = useState('');
  const [templateNote, setTemplateNote] = useState('');
  const [templateTags, setTemplateTags] = useState('');
  const [templateFavorite, setTemplateFavorite] = useState(false);

  const [recurringName, setRecurringName] = useState('');
  const [recurringType, setRecurringType] = useState<TransactionType>('keluar');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringCategory, setRecurringCategory] = useState('');
  const [recurringWallet, setRecurringWallet] = useState('');
  const [recurringDay, setRecurringDay] = useState(String(new Date().getDate()));
  const [recurringNote, setRecurringNote] = useState('');
  const [recurringTags, setRecurringTags] = useState('');

  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderBody, setReminderBody] = useState('');
  const [reminderDueAt, setReminderDueAt] = useState(todayInputValue());
  const [reminderChannel, setReminderChannel] = useState('in_app');

  const openReminders = useMemo(
    () => reminders.filter((reminder) => !reminder.completedAt),
    [reminders]
  );
  const completedReminders = reminders.length - openReminders.length;
  const activeWallets = useMemo(() => getActiveWallets(balances), [balances]);
  const currentTemplateWallet = activeWallets.some((wallet) => wallet.name === templateWallet)
    ? templateWallet
    : activeWallets[0]?.name || '';
  const currentRecurringWallet = activeWallets.some((wallet) => wallet.name === recurringWallet)
    ? recurringWallet
    : activeWallets[0]?.name || '';

  const runAction = async (key: string, action: () => Promise<ActionResult>, successText: string) => {
    setBusy(key);
    setMessage(null);
    const result = await action();
    if (result.success) {
      setMessage({ type: 'success', text: successText });
      router.refresh();
    } else {
      setMessage({ type: 'error', text: result.error || 'Action failed' });
    }
    setBusy(null);
  };

  const handleTemplateSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!currentTemplateWallet) {
      setMessage({ type: 'error', text: 'Tambah wallet dulu sebelum membuat template.' });
      return;
    }
    runAction('template:create', async () => {
      const result = await upsertTransactionTemplate({
        name: templateName,
        type: templateType,
        amount: toNumber(templateAmount),
        categoryName: templateCategory,
        walletName: currentTemplateWallet,
        note: templateNote,
        tags: splitTags(templateTags),
        isFavorite: templateFavorite,
      });
      if (result.success) {
        setTemplateName('');
        setTemplateAmount('');
        setTemplateCategory('');
        setTemplateNote('');
        setTemplateTags('');
        setTemplateFavorite(false);
      }
      return result;
    }, 'Template saved.');
  };

  const handleRecurringSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!currentRecurringWallet) {
      setMessage({ type: 'error', text: 'Tambah wallet dulu sebelum membuat recurring rule.' });
      return;
    }
    runAction('recurring:create', async () => {
      const result = await addRecurringRule({
        name: recurringName,
        type: recurringType,
        amount: toNumber(recurringAmount),
        categoryName: recurringCategory,
        walletName: currentRecurringWallet,
        note: recurringNote,
        tags: splitTags(recurringTags),
        dayOfMonth: Number(recurringDay),
      });
      if (result.success) {
        setRecurringName('');
        setRecurringAmount('');
        setRecurringCategory('');
        setRecurringNote('');
        setRecurringTags('');
      }
      return result;
    }, 'Recurring rule saved.');
  };

  const handleReminderSubmit = (event: FormEvent) => {
    event.preventDefault();
    runAction('reminder:create', async () => {
      const result = await addReminder({
        title: reminderTitle,
        body: reminderBody,
        channel: reminderChannel,
        dueAt: reminderDueAt,
      });
      if (result.success) {
        setReminderTitle('');
        setReminderBody('');
        setReminderDueAt(todayInputValue());
        setReminderChannel('in_app');
      }
      return result;
    }, 'Reminder saved.');
  };

  const inputClass = 'brutal-input w-full px-3 py-2 text-xs font-bold';
  const selectClass = 'w-full bg-white border-[3px] border-black px-3 py-2 text-xs font-black uppercase tracking-wider outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';

  return (
    <div className="space-y-6">
      <div className="brutal-card bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-black">Automation</h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
              Templates, recurring transactions, and reminders now live in the database.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase tracking-wider">
            <span className="border-[2px] border-black bg-[#fef3c7] px-3 py-2">{templates.length} templates</span>
            <span className="border-[2px] border-black bg-[#bfdbfe] px-3 py-2">{recurringTransactions.length} recurring</span>
            <span className="border-[2px] border-black bg-[#bbf7d0] px-3 py-2">{openReminders.length} open</span>
          </div>
        </div>
        {message && (
          <div className={`mt-4 border-[2px] border-black px-3 py-2 text-xs font-black uppercase tracking-wider ${
            message.type === 'success' ? 'bg-[#bbf7d0] text-black' : 'bg-[#fecaca] text-black'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="brutal-card bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-black">
            <Star className="h-4 w-4 stroke-[3px]" />
            Templates
          </h3>
          <form onSubmit={handleTemplateSubmit} className="space-y-3">
            <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} className={inputClass} placeholder="Template name" required />
            <div className="grid grid-cols-2 gap-3">
              <select value={templateType} onChange={(event) => setTemplateType(event.target.value as TransactionType)} className={selectClass}>
                <option value="keluar">Expense</option>
                <option value="masuk">Income</option>
              </select>
              <input value={templateAmount} onChange={(event) => setTemplateAmount(event.target.value)} className={inputClass} placeholder="Amount" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={templateCategory} onChange={(event) => setTemplateCategory(event.target.value)} className={inputClass} placeholder="Category" required />
              <WalletSelect wallets={balances} value={currentTemplateWallet} onChange={setTemplateWallet} className={selectClass} required />
            </div>
            <input value={templateNote} onChange={(event) => setTemplateNote(event.target.value)} className={inputClass} placeholder="Note" />
            <input value={templateTags} onChange={(event) => setTemplateTags(event.target.value)} className={inputClass} placeholder="#tags" />
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black">
              <input type="checkbox" checked={templateFavorite} onChange={(event) => setTemplateFavorite(event.target.checked)} className="h-4 w-4 accent-black" />
              Favorite
            </label>
            <button type="submit" disabled={busy === 'template:create'} className="brutal-btn flex w-full items-center justify-center gap-2 py-2.5 text-xs">
              {busy === 'template:create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save Template
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {templates.length === 0 ? (
              <div className="border-[3px] border-dashed border-black p-4 text-center text-xs font-black uppercase tracking-wider text-neutral-500">
                No templates yet.
              </div>
            ) : templates.map((template) => (
              <div key={template.id} className="border-[2px] border-black bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black uppercase tracking-wider text-black">{template.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                      {template.categoryName} / {template.walletName} / {formatRupiah(template.amount)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => runAction(`template:use:${template.id}`, () => runTransactionTemplate(template.id), 'Transaction created from template.')} className="border border-black bg-[#bbf7d0] p-1" title="Use template"><Play className="h-3.5 w-3.5 stroke-[3px]" /></button>
                    <button type="button" onClick={() => runAction(`template:star:${template.id}`, () => toggleTemplateFavorite(template.id), 'Favorite updated.')} className={`border border-black p-1 ${template.isFavorite ? 'bg-[#fef08a]' : 'bg-white'}`} title="Favorite"><Star className="h-3.5 w-3.5 stroke-[3px]" /></button>
                    <button type="button" onClick={() => runAction(`template:delete:${template.id}`, () => deleteTransactionTemplate(template.id), 'Template deleted.')} className="border border-black bg-white p-1 hover:bg-[#fecaca]" title="Delete"><Trash2 className="h-3.5 w-3.5 stroke-[3px]" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="brutal-card bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-black">
            <CalendarClock className="h-4 w-4 stroke-[3px]" />
            Recurring
          </h3>
          <form onSubmit={handleRecurringSubmit} className="space-y-3">
            <input value={recurringName} onChange={(event) => setRecurringName(event.target.value)} className={inputClass} placeholder="Rule name" required />
            <div className="grid grid-cols-2 gap-3">
              <select value={recurringType} onChange={(event) => setRecurringType(event.target.value as TransactionType)} className={selectClass}>
                <option value="keluar">Expense</option>
                <option value="masuk">Income</option>
              </select>
              <input value={recurringAmount} onChange={(event) => setRecurringAmount(event.target.value)} className={inputClass} placeholder="Amount" required />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input value={recurringCategory} onChange={(event) => setRecurringCategory(event.target.value)} className={inputClass} placeholder="Category" required />
              <WalletSelect wallets={balances} value={currentRecurringWallet} onChange={setRecurringWallet} className={selectClass} required />
              <input value={recurringDay} onChange={(event) => setRecurringDay(event.target.value)} className={inputClass} placeholder="Day" required />
            </div>
            <input value={recurringNote} onChange={(event) => setRecurringNote(event.target.value)} className={inputClass} placeholder="Note" />
            <input value={recurringTags} onChange={(event) => setRecurringTags(event.target.value)} className={inputClass} placeholder="#tags" />
            <button type="submit" disabled={busy === 'recurring:create'} className="brutal-btn flex w-full items-center justify-center gap-2 py-2.5 text-xs">
              {busy === 'recurring:create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save Recurring Rule
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {recurringTransactions.length === 0 ? (
              <div className="border-[3px] border-dashed border-black p-4 text-center text-xs font-black uppercase tracking-wider text-neutral-500">
                No recurring rules yet.
              </div>
            ) : recurringTransactions.map((rule) => (
              <div key={rule.id} className="border-[2px] border-black bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black uppercase tracking-wider text-black">{rule.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                      Day {rule.dayOfMonth} / {rule.categoryName} / {formatRupiah(rule.amount)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => runAction(`recurring:toggle:${rule.id}`, () => toggleRecurringRule(rule.id), 'Recurring rule updated.')} className={`border border-black px-2 py-1 text-[9px] font-black uppercase ${rule.isActive ? 'bg-[#bbf7d0]' : 'bg-neutral-100'}`}>
                      {rule.isActive ? 'On' : 'Off'}
                    </button>
                    <button type="button" onClick={() => runAction(`recurring:delete:${rule.id}`, () => deleteRecurringRule(rule.id), 'Recurring rule deleted.')} className="border border-black bg-white p-1 hover:bg-[#fecaca]" title="Delete"><Trash2 className="h-3.5 w-3.5 stroke-[3px]" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="brutal-card bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-black">
            <Bell className="h-4 w-4 stroke-[3px]" />
            Reminders
          </h3>
          <form onSubmit={handleReminderSubmit} className="space-y-3">
            <input value={reminderTitle} onChange={(event) => setReminderTitle(event.target.value)} className={inputClass} placeholder="Reminder title" required />
            <input value={reminderBody} onChange={(event) => setReminderBody(event.target.value)} className={inputClass} placeholder="Reminder message" required />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={reminderDueAt} onChange={(event) => setReminderDueAt(event.target.value)} className={inputClass} required />
              <select value={reminderChannel} onChange={(event) => setReminderChannel(event.target.value)} className={selectClass}>
                <option value="in_app">In App</option>
                <option value="email">Email Queue</option>
              </select>
            </div>
            <button type="submit" disabled={busy === 'reminder:create'} className="brutal-btn flex w-full items-center justify-center gap-2 py-2.5 text-xs">
              {busy === 'reminder:create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save Reminder
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {reminders.length === 0 ? (
              <div className="border-[3px] border-dashed border-black p-4 text-center text-xs font-black uppercase tracking-wider text-neutral-500">
                No reminders yet.
              </div>
            ) : reminders.map((reminder) => (
              <div key={reminder.id} className={`border-[2px] border-black p-3 ${reminder.completedAt ? 'bg-neutral-100 opacity-70' : 'bg-white'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black uppercase tracking-wider text-black">{reminder.title}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{reminder.body}</p>
                    {reminder.channel === 'email' && (
                      <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-neutral-500">
                        {reminder.emailSentAt
                          ? `Email sent ${new Date(reminder.emailSentAt).toLocaleDateString('id-ID')}`
                          : reminder.emailLastError
                            ? `Email failed (${reminder.emailAttemptCount}/3)`
                            : 'Email queued'}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => runAction(`reminder:complete:${reminder.id}`, () => completeReminder(reminder.id), 'Reminder updated.')} className="border border-black bg-[#bbf7d0] p-1" title="Complete"><Check className="h-3.5 w-3.5 stroke-[3px]" /></button>
                    <button type="button" onClick={() => runAction(`reminder:delete:${reminder.id}`, () => deleteReminder(reminder.id), 'Reminder deleted.')} className="border border-black bg-white p-1 hover:bg-[#fecaca]" title="Delete"><Trash2 className="h-3.5 w-3.5 stroke-[3px]" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {completedReminders > 0 && (
            <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-neutral-500">{completedReminders} completed reminders kept for history.</p>
          )}
        </section>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { Send, Loader2, Camera, RotateCcw } from 'lucide-react';
import { processInput, addExplicitTransaction, deleteTransaction } from '../app/actions';

interface ReceiptScan {
  amount: number;
  merchant?: string;
  note?: string;
  date?: string;
  items?: unknown;
  suggestedText: string;
}

export default function QuickInput() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [undoTxId, setUndoTxId] = useState<string | null>(null);
  const [receiptScan, setReceiptScan] = useState<ReceiptScan | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearUndoTimer = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  };

  const startUndoWindow = (transactionId: string) => {
    clearUndoTimer();
    setUndoTxId(transactionId);
    undoTimerRef.current = setTimeout(() => {
      setUndoTxId(null);
      undoTimerRef.current = null;
    }, 5000);
  };

  const handleUndo = async () => {
    if (!undoTxId) return;

    const targetId = undoTxId;
    clearUndoTimer();
    setUndoTxId(null);
    setLoading(true);

    const res = await deleteTransaction(targetId);
    setMessage(
      res.success
        ? { type: 'success', text: 'Transaksi dibatalkan.' }
        : { type: 'error', text: res.error || 'Gagal membatalkan transaksi' }
    );
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const suggestedText = `${data.amount} ${data.note || data.merchant || 'receipt'} cash`;
      setReceiptScan({
        amount: data.amount,
        merchant: data.merchant,
        note: data.note,
        date: data.date,
        items: data.items,
        suggestedText,
      });
      setInput(suggestedText);
      setMessage({ type: 'success', text: 'Struk berhasil dibaca! Silakan cek dan pilih metode (default: cash).' });
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : 'Gagal scan struk';
      setMessage({ type: 'error', text });
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setMessage(null);

    const currentInput = input.trim();
    const res = receiptScan && currentInput === receiptScan.suggestedText
      ? await addExplicitTransaction({
          type: 'keluar',
          amount: receiptScan.amount,
          category: 'Belanja',
          wallet: 'cash',
          note: receiptScan.merchant || receiptScan.note || 'Receipt',
          tags: ['receipt'],
          receiptMerchant: receiptScan.merchant,
          receiptItems: receiptScan.items,
          receiptDate: receiptScan.date,
        })
      : await processInput(currentInput);
    if (res.success) {
      const transactionId = 'transactionId' in res && typeof res.transactionId === 'string'
        ? res.transactionId
        : null;
      const action = 'action' in res ? res.action : undefined;
      const walletName = 'walletName' in res && typeof res.walletName === 'string'
        ? res.walletName
        : 'wallet';

      setInput('');
      setReceiptScan(null);
      if (transactionId) {
        setMessage({ type: 'success', text: 'Transaksi berhasil ditambahkan.' });
        startUndoWindow(transactionId);
      } else if (action === 'balance_update') {
        setMessage({ type: 'success', text: `Saldo ${walletName} diperbarui.` });
        setUndoTxId(null);
      } else {
        setMessage({ type: 'success', text: 'Tersimpan.' });
        setUndoTxId(null);
      }
      setTimeout(() => setMessage(null), 5000);
    } else {
      setMessage({ type: 'error', text: res.error || 'Gagal menyimpan' });
    }
    
    setLoading(false);
  };

  return (
    <div className="brutal-card p-6 bg-white">
      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Catat Cepat (AI)</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || scanning}
          className="brutal-btn-light px-4 flex items-center justify-center rounded-lg"
          title="Scan Struk"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <Camera className="w-4 h-4 text-slate-600" />}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Cth: 10k middleman bni #jasa"
          className="flex-1 brutal-input px-4 py-3 text-xs font-semibold"
          disabled={loading || scanning}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="brutal-btn px-6 flex items-center justify-center min-w-[64px] rounded-lg"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
      {message && (
        <div className={`mt-4 flex items-center justify-between gap-3 p-3 border rounded-lg text-xs font-semibold ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          <span>{message.text}</span>
          {message.type === 'success' && undoTxId && (
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-2.5 py-1 font-bold text-emerald-800 transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

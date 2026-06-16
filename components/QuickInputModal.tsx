'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Loader2, Camera, X, RotateCcw, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { processInput, addExplicitTransaction, addTransferTransaction, addRecurringTransaction, deleteTransaction } from '../app/actions';
import { Balance } from '../types';
import WalletSelect, { getActiveWallets } from './WalletSelect';
import { formatCurrency } from '../lib/format';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  txId?: string | null;
}

interface ReceiptScan {
  amount: number;
  merchant?: string;
  note?: string;
  date?: string;
  items?: unknown;
  suggestedText: string;
}

export default function QuickInputModal({
  balances,
  onClose,
  onSuccess,
}: {
  balances: Balance[];
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'quick' | 'manual'>('quick');
  
  // Quick/Chat mode states
  const [input, setInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [receiptScan, setReceiptScan] = useState<ReceiptScan | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'ai',
      text: 'Halo! Saya Norden AI Parser. Silakan ketik transaksi Anda seperti chat biasa (contoh: "makan soto 15k cash" atau "saldo gopay 200k"). Saya akan mencatatnya ke database Anda secara otomatis.'
    }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual mode states
  const [mType, setMType] = useState<'masuk' | 'keluar' | 'transfer'>('keluar');
  const [mAmount, setMAmount] = useState('');
  const [mCategory, setMCategory] = useState('');
  const [mMethod, setMMethod] = useState('');
  const [mToMethod, setMToMethod] = useState('');
  const [mNote, setMNote] = useState('');
  const [mTags, setMTags] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  // Common states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [undoTxId, setUndoTxId] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeWallets = useMemo(() => getActiveWallets(balances), [balances]);
  const currentMethod = activeWallets.some((wallet) => wallet.name === mMethod)
    ? mMethod
    : activeWallets[0]?.name || '';
  const currentToMethod = activeWallets.some((wallet) => wallet.name === mToMethod) ? mToMethod : '';

  const refreshAfterMutation = () => {
    if (onSuccess) {
      onSuccess();
      return;
    }
    router.refresh();
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (mode === 'quick') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, loading, mode]);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setMessage(null);
      setUndoTxId(null);
      onClose();
    }, 5000);
  };

  // Chat send handler
  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsgText = text.trim();
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: userMsgText,
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const isAcceptedReceipt = receiptScan && userMsgText === receiptScan.suggestedText;
      const res = isAcceptedReceipt
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
        : await processInput(userMsgText);
      let aiText = '';
      let txId: string | null = null;

      if (res.success && isAcceptedReceipt) {
        refreshAfterMutation();
        const formattedAmount = formatCurrency(receiptScan.amount);
        aiText = `Receipt saved for ${receiptScan.merchant || receiptScan.note || 'belanja'} sebesar ${formattedAmount}.`;
        if ('transactionId' in res && typeof res.transactionId === 'string') {
          txId = res.transactionId;
        }
        setReceiptScan(null);
      } else if (res.success && 'result' in res && res.result) {
        refreshAfterMutation();
        const amountVal = res.result.amount;
        const formattedAmount = formatCurrency(amountVal);

        if (res.action === 'balance_update') {
          aiText = `✅ Saldo ${res.walletName} berhasil diperbarui menjadi ${formattedAmount}.`;
        } else {
          const item = res.result.note && res.result.note !== '-' ? res.result.note : 'Transaksi';
          const wallet = res.walletName || 'Cash';
          const category = res.result.category || 'Lain-lain';
          aiText = `✅ Berhasil mencatat ${item} sebesar ${formattedAmount}. Dompet: ${wallet}. Kategori: ${category}.`;
          
          if ('transactionId' in res && typeof res.transactionId === 'string') {
            txId = res.transactionId;
          }
        }
      } else {
        const errorText = !res.success && 'error' in res && typeof res.error === 'string'
          ? res.error
          : 'Format input tidak dikenali.';
        aiText = `❌ Gagal mencatat: ${errorText}`;
      }

      setChatMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'ai',
        text: aiText,
        txId
      }]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setChatMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'ai',
        text: `❌ Error: ${message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Undo inside Chat
  const handleUndoChat = async (txId: string, msgId: string) => {
    setLoading(true);
    const res = await deleteTransaction(txId);
    if (res.success) {
      refreshAfterMutation();
      setChatMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return { ...m, text: '↩️ Transaksi berhasil dibatalkan.', txId: null };
        }
        return m;
      }));
    } else {
      alert(res.error || 'Gagal membatalkan transaksi');
    }
    setLoading(false);
  };

  // Manual Mode Undo
  const handleUndo = async () => {
    if (!undoTxId) return;

    const targetId = undoTxId;
    clearCloseTimer();
    setUndoTxId(null);
    setLoading(true);

    const res = await deleteTransaction(targetId);
    setMessage(
      res.success
          ? { type: 'success', text: 'Transaksi dibatalkan.' }
          : { type: 'error', text: res.error || 'Gagal membatalkan transaksi' }
    );
    setLoading(false);

    if (res.success) {
      refreshAfterMutation();
      setTimeout(onClose, 1200);
    }
  };

  // Struk Upload Scanner
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setChatMessages(prev => [...prev, {
      id: Math.random().toString(),
      sender: 'user',
      text: '📷 [Mengunggah struk belanja...]'
    }]);

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
      setChatMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'ai',
        text: `🔍 Struk berhasil dibaca! Kami mendeteksi nominal ${formatCurrency(data.amount)} untuk "${data.note}". Silakan kirim pesan di bawah untuk mencatatnya:`,
      }]);
      setInput(suggestedText);
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : 'Gagal scan struk';
      setChatMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'ai',
        text: `❌ Gagal membaca struk: ${text}`
      }]);
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Manual Form Submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage(null);

    let res;
    const amount = parseInt(mAmount.replace(/\D/g, ''), 10);
    if (!amount || !currentMethod || (mType === 'transfer' && !currentToMethod) || (mType !== 'transfer' && !mCategory)) {
      setMessage({ type: 'error', text: 'Semua field wajib harus diisi' });
      setLoading(false);
      return;
    }
    const tagsArray = mTags.split(' ').map(t => t.replace('#', '').trim()).filter(Boolean);
    
    if (mType === 'transfer') {
      res = await addTransferTransaction(amount, currentMethod, currentToMethod, mNote, tagsArray);
    } else {
      if (isRecurring) {
        res = await addRecurringTransaction({
          type: mType,
          amount,
          category: mCategory,
          method: currentMethod,
          note: mNote,
          tags: tagsArray
        });
      } else {
        res = await addExplicitTransaction({
          type: mType,
          amount,
          category: mCategory,
          method: currentMethod,
          note: mNote,
          tags: tagsArray
        });
      }
    }

    if (res.success) {
      refreshAfterMutation();
      const transactionId = 'transactionId' in res && typeof res.transactionId === 'string'
        ? res.transactionId
        : null;
      const action = 'action' in res ? res.action : undefined;
      const walletName = 'walletName' in res && typeof res.walletName === 'string'
        ? res.walletName
        : 'wallet';

      setMAmount(''); setMCategory(''); setMNote(''); setMTags(''); setMToMethod(''); setIsRecurring(false);
      
      if (transactionId) {
        setUndoTxId(transactionId);
        setMessage({ type: 'success', text: 'Transaksi berhasil ditambahkan.' });
        scheduleClose();
      } else if (action === 'balance_update') {
        setUndoTxId(null);
        setMessage({ type: 'success', text: `Saldo ${walletName} diperbarui.` });
        setTimeout(onClose, 1500);
      } else {
        setUndoTxId(null);
        setMessage({ type: 'success', text: 'Tersimpan.' });
        setTimeout(onClose, 1500);
      }
    } else {
      setMessage({ type: 'error', text: res.error || 'Gagal menyimpan' });
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white border-[3px] border-black w-full max-w-md overflow-hidden rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b-[3px] border-black flex justify-between items-center bg-white">
          <h2 className="font-black text-black text-base uppercase tracking-wider">Tambah Transaksi</h2>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-50 rounded-none transition-colors cursor-pointer border border-transparent hover:border-black">
            <X className="w-5 h-5 stroke-[2.5px]" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b-[3px] border-black bg-[#f3f4f6]">
          <button 
            type="button"
            onClick={() => setMode('quick')} 
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-r-[3px] border-black ${
              mode === 'quick' ? 'bg-white text-black font-black' : 'text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            Input Cepat (Chat AI)
          </button>
          <button 
            type="button"
            onClick={() => setMode('manual')} 
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              mode === 'manual' ? 'bg-white text-black font-black' : 'text-neutral-500 hover:bg-neutral-50'
            }`}
          >
            Form Manual
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {mode === 'quick' ? (
            <div className="space-y-4">
              {/* Chat-style log */}
              <div className="h-[260px] bg-[#E5DDD5] border-[3px] border-black p-4 overflow-y-auto flex flex-col gap-3.5 relative">
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`self-${msg.sender === 'user' ? 'end bg-[#DCF8C6]' : 'start bg-white'} border-[2px] border-black p-3 max-w-[85%] rounded-none shadow-[2.5px_2.5px_0px_0px_#000] flex gap-2 items-start transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 z-10`}
                  >
                    {msg.sender === 'ai' && (
                      <Sparkles className="w-4 h-4 stroke-[2.5px] text-[#4B6DFE] shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <span className={`text-[9px] font-black block mb-0.5 uppercase ${msg.sender === 'user' ? 'text-neutral-600' : 'text-[#4B6DFE]'}`}>
                        {msg.sender === 'user' ? 'Anda' : 'Norden AI'}
                      </span>
                      <p className="text-[10px] font-bold text-black leading-snug whitespace-pre-line">{msg.text}</p>
                      
                      {msg.txId && (
                        <button
                          type="button"
                          onClick={() => handleUndoChat(msg.txId!, msg.id)}
                          className="mt-2 text-[9px] font-black text-red-600 hover:text-red-800 underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3 stroke-[2.5px]" /> Batal / Undo
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="self-start bg-white border-[2px] border-black p-2.5 max-w-[85%] rounded-none shadow-[2px_2px_0px_0px_#000] flex gap-1.5 items-center z-10">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Mencatat...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSend('kopi starbucks 55k bca')}
                  className="bg-white border-[1.5px] border-black text-[9px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-neutral-50 active:translate-y-[1px] active:shadow-none transition-all rounded-none cursor-pointer"
                  disabled={loading}
                >
                  ☕ Kopi 55k BCA
                </button>
                <button
                  type="button"
                  onClick={() => handleSend('gaji masuk 12jt bca')}
                  className="bg-white border-[1.5px] border-black text-[9px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-neutral-50 active:translate-y-[1px] active:shadow-none transition-all rounded-none cursor-pointer"
                  disabled={loading}
                >
                  💼 Gaji 12jt BCA
                </button>
                <button
                  type="button"
                  onClick={() => handleSend('gojek 22rb cash')}
                  className="bg-white border-[1.5px] border-black text-[9px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-neutral-50 active:translate-y-[1px] active:shadow-none transition-all rounded-none cursor-pointer"
                  disabled={loading}
                >
                  🚗 Gojek 22rb Cash
                </button>
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex gap-2 items-center"
              >
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
                  className="p-3 bg-white border-[2.5px] border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center rounded-none"
                  title="Scan Struk"
                >
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Camera className="w-4 h-4 text-black stroke-[2.5px]" />}
                </button>
                
                <div className="flex-1 flex border-[2.5px] border-black bg-white p-1 shadow-[2.5px_2.5px_0px_0px_#000] items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Beli makan siang 15k cash..."
                    className="flex-1 text-[10px] font-bold text-black pl-2 focus:outline-none placeholder-neutral-400"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-[#FFE066] border-[1.5px] border-black p-1.5 cursor-pointer hover:bg-[#ffd533] active:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5 stroke-[2.5px]" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button type="button" onClick={() => setMType('keluar')} className={`flex-1 py-2 text-xs font-black rounded-none border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer ${
                    mType === 'keluar' ? 'bg-[#fecaca] text-black' : 'bg-white text-black'
                  }`}>Pengeluaran</button>
                  <button type="button" onClick={() => setMType('masuk')} className={`flex-1 py-2 text-xs font-black rounded-none border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer ${
                    mType === 'masuk' ? 'bg-[#bbf7d0] text-black' : 'bg-white text-black'
                  }`}>Pemasukan</button>
                  <button type="button" onClick={() => setMType('transfer')} className={`flex-1 py-2 text-xs font-black rounded-none border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer ${
                    mType === 'transfer' ? 'bg-[#bfdbfe] text-black' : 'bg-white text-black'
                  }`}>Transfer</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-neutral-500 mb-1 uppercase tracking-widest">Nominal</label>
                    <input type="text" placeholder="e.g. 50000" value={mAmount} onChange={e => setMAmount(e.target.value)} className="brutal-input text-xs font-bold" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-500 mb-1 uppercase tracking-widest">{mType === 'transfer' ? 'Dari Wallet' : 'Wallet'}</label>
                    <WalletSelect wallets={balances} value={currentMethod} onChange={setMMethod} className="brutal-input text-xs uppercase font-bold" required />
                  </div>
                </div>
                
                {mType === 'transfer' ? (
                  <div>
                    <label className="block text-[10px] font-black text-neutral-500 mb-1 uppercase tracking-widest">Ke Wallet</label>
                    <WalletSelect wallets={balances} value={currentToMethod} onChange={setMToMethod} className="brutal-input text-xs uppercase font-bold" required />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-black text-neutral-500 mb-1 uppercase tracking-widest">Kategori</label>
                    <input type="text" placeholder="e.g. makan, transport" value={mCategory} onChange={e => setMCategory(e.target.value)} className="brutal-input text-xs font-bold" required />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 mb-1 uppercase tracking-widest">Catatan (Opsional)</label>
                  <input type="text" placeholder="e.g. Makan siang kantor" value={mNote} onChange={e => setMNote(e.target.value)} className="brutal-input text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 mb-1 uppercase tracking-widest">Tag (Opsional)</label>
                  <input type="text" placeholder="e.g. #makan #kerja" value={mTags} onChange={e => setMTags(e.target.value)} className="brutal-input text-xs font-bold" />
                </div>
                {mType !== 'transfer' && (
                  <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                    <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="w-4 h-4 border-[2px] border-black rounded-none accent-black cursor-pointer" />
                    <span className="text-xs font-black text-neutral-600 uppercase tracking-wider">Berulang tiap bulan (Tagihan / Langganan)</span>
                  </label>
                )}
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full brutal-btn py-2.5 mt-6 flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 stroke-[2.5px]" />}
                <span>Simpan Transaksi</span>
              </button>
            </form>
          )}

          {/* Alert Message for Manual Form or Undos */}
          {message && (
            <div className={`mt-4 flex items-center justify-between gap-3 text-xs font-black p-3 border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider animate-in fade-in duration-200 ${
              message.type === 'success' ? 'bg-[#bbf7d0] text-black' : 'bg-[#fecaca] text-black'
            }`}>
              <span>{message.text}</span>
              {message.type === 'success' && undoTxId && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="inline-flex items-center gap-1.5 rounded-none border-[2px] border-black bg-white px-2.5 py-1 font-black text-black transition-colors hover:bg-neutral-150 focus:outline-none cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 stroke-[2.5px]" />
                  Undo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { formatCurrency } from '../lib/format';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  parsedDetails?: {
    item: string;
    amount: string;
    wallet: string;
    category: string;
    type: 'pemasukan' | 'pengeluaran' | 'transfer';
  };
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  tx: string;
  ty: string;
}

export default function ChatSandbox() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'user',
      text: 'Makan siang padang 35rb cash'
    },
    {
      id: '2',
      sender: 'ai',
      text: '✅ Berhasil mencatat Nasi Padang sebesar Rp 35.000. Dompet: Cash. Kategori: Makanan & Minuman.'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const triggerConfetti = () => {
    const colors = ['#FFE066', '#4B6DFE', '#2ECC71', '#FF6B6B', '#A78BFA'];
    const newParticles: Particle[] = [];
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = (i * (360 / count) * Math.PI) / 180;
      const speed = 2.5 + Math.random() * 5;
      newParticles.push({
        id: Math.random() + i,
        x: 50,
        y: 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        tx: `${Math.cos(angle) * speed * 22}px`,
        ty: `${Math.sin(angle) * speed * 22}px`,
      });
    }
    setParticles(newParticles);
    setTimeout(() => {
      setParticles([]);
    }, 1200);
  };

  function parseText(text: string) {
    const normalized = text.toLowerCase();
    
    // Parse Amount
    let amount = 'Rp 0';
    let rawAmount = 0;
    const kMatch = normalized.match(/(\d+(?:\.\d+)?)\s*k\b/);
    const rbMatch = normalized.match(/(\d+(?:\.\d+)?)\s*rb\b/);
    const jtMatch = normalized.match(/(\d+(?:\.\d+)?)\s*jt\b/);
    const numMatch = normalized.match(/(\d[\d\.]*)/);

    if (jtMatch) {
      rawAmount = parseFloat(jtMatch[1]) * 1000000;
    } else if (kMatch) {
      rawAmount = parseFloat(kMatch[1]) * 1000;
    } else if (rbMatch) {
      rawAmount = parseFloat(rbMatch[1]) * 1000;
    } else if (numMatch) {
      rawAmount = parseInt(numMatch[1].replace(/\./g, ''), 10);
    }
    if (rawAmount) {
      amount = formatCurrency(rawAmount);
    }

    // Parse Wallet
    let wallet = 'Cash';
    if (normalized.includes('bca')) wallet = 'BCA';
    else if (normalized.includes('mandiri')) wallet = 'Mandiri';
    else if (normalized.includes('gopay')) wallet = 'GoPay';
    else if (normalized.includes('ovo')) wallet = 'OVO';
    else if (normalized.includes('dana')) wallet = 'DANA';
    else if (normalized.includes('bni')) wallet = 'BNI';

    // Parse Type & Category
    let type: 'pemasukan' | 'pengeluaran' | 'transfer' = 'pengeluaran';
    let category = 'Lain-lain';
    let item = 'Transaksi';

    if (normalized.includes('gaji') || normalized.includes('masuk') || normalized.includes('dapat')) {
      type = 'pemasukan';
      category = 'Pendapatan';
      item = 'Gaji/Pendapatan';
    } else if (normalized.includes('trf') || normalized.includes('transfer') || normalized.includes('kirim')) {
      type = 'transfer';
      category = 'Transfer Internal';
      item = 'Transfer Saldo';
    } else {
      // Guess item
      if (normalized.includes('kopi') || normalized.includes('coffee') || normalized.includes('starbucks')) {
        item = 'Kopi';
        category = 'Makanan & Minuman';
      } else if (normalized.includes('padang') || normalized.includes('makan') || normalized.includes('bakso') || normalized.includes('nasi')) {
        item = 'Makanan Siang';
        category = 'Makanan & Minuman';
      } else if (normalized.includes('bensin') || normalized.includes('gojek') || normalized.includes('grab') || normalized.includes('tax')) {
        item = 'Transportasi';
        category = 'Transportasi';
      } else if (normalized.includes('film') || normalized.includes('nonton') || normalized.includes('netflix') || normalized.includes('bioskop')) {
        item = 'Hiburan';
        category = 'Hiburan';
      }
    }

    return { item, amount, wallet, category, type };
  }

  function handleSend(text: string) {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const parsed = parseText(text);
      let aiText = '';
      if (parsed.type === 'pemasukan') {
        aiText = `✅ Pendapatan ${parsed.amount} (${parsed.item}) berhasil ditambahkan ke saldo ${parsed.wallet}.`;
      } else if (parsed.type === 'transfer') {
        aiText = `✅ Transfer saldo sebesar ${parsed.amount} berhasil diproses dari/ke ${parsed.wallet}.`;
      } else {
        aiText = `✅ Berhasil mencatat ${parsed.item} sebesar ${parsed.amount}. Dompet: ${parsed.wallet}. Kategori: ${parsed.category}.`;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        parsedDetails: parsed
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      triggerConfetti();
    }, 800); // 800ms natural response delay
  }

  return (
    <div className="flex-1 p-4 bg-[#E5DDD5] overflow-hidden flex flex-col justify-between h-full relative">
      <style>{`
        @keyframes particle-explode {
          0% {
            transform: translate(-50%, -50%) scale(1) translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0) translate(var(--tx), var(--ty)) rotate(180deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Confetti Particle Layer */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute w-2 h-2 pointer-events-none z-50 rounded-none border border-black shadow-[1.5px_1.5px_0px_0px_#000]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            '--tx': p.tx,
            '--ty': p.ty,
            animation: 'particle-explode 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
          } as React.CSSProperties}
        />
      ))}

      {/* Scrollable chat body */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto mb-3 pr-1">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`self-${msg.sender === 'user' ? 'end bg-[#DCF8C6]' : 'start bg-white'} border-[1.5px] border-black p-2.5 max-w-[85%] rounded-none shadow-[2px_2px_0px_0px_#000] flex gap-2 items-start transition-all duration-200 animate-in fade-in slide-in-from-bottom-2`}
          >
            {msg.sender === 'ai' && (
              <Sparkles className="w-3.5 h-3.5 stroke-[3px] text-[#4B6DFE] shrink-0 mt-0.5" />
            )}
            <div>
              {msg.sender === 'user' ? (
                <span className="text-[9px] font-black text-neutral-600 block mb-0.5">Anda</span>
              ) : (
                <span className="text-[9px] font-black text-[#4B6DFE] block mb-0.5">Norden AI Parser</span>
              )}
              <p className="text-[10px] font-bold text-black leading-snug">{msg.text}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="self-start bg-white border-[1.5px] border-black p-2 max-w-[85%] rounded-none shadow-[2px_2px_0px_0px_#000] flex gap-1.5 items-center">
            <span className="text-[9px] font-black text-neutral-400 animate-pulse">Norden AI sedang mencatat...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Inputs */}
      <div className="mb-2.5 flex flex-wrap gap-1.5 select-none">
        <button
          onClick={() => handleSend('kopi starbucks 55k bca')}
          className="bg-white border-[1.5px] border-black text-[9px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-neutral-50 active:translate-y-[1px] active:shadow-none transition-all rounded-none cursor-pointer"
        >
          ☕ Kopi 55k BCA
        </button>
        <button
          onClick={() => handleSend('gaji masuk 12jt bca')}
          className="bg-white border-[1.5px] border-black text-[9px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-neutral-50 active:translate-y-[1px] active:shadow-none transition-all rounded-none cursor-pointer"
        >
          💼 Gaji 12jt BCA
        </button>
        <button
          onClick={() => handleSend('gojek 22rb cash')}
          className="bg-white border-[1.5px] border-black text-[9px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-neutral-50 active:translate-y-[1px] active:shadow-none transition-all rounded-none cursor-pointer"
        >
          🚗 Gojek 22rb Cash
        </button>
      </div>

      {/* Input bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend(inputValue);
        }}
        className="border-[2.5px] border-black bg-white p-1 flex items-center justify-between gap-2 shadow-[2.5px_2.5px_0px_0px_#000]"
      >
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Coba ketik transaksi Anda di sini..."
          className="text-[10px] font-bold text-black pl-2 flex-1 focus:outline-none placeholder-neutral-400"
        />
        <button
          type="submit"
          className="bg-[#FFE066] border-[1.5px] border-black p-1.5 cursor-pointer hover:bg-[#ffd533] active:translate-y-[1px] transition-all"
        >
          <Send className="w-3.5 h-3.5 stroke-[2.5px]" />
        </button>
      </form>
    </div>
  );
}

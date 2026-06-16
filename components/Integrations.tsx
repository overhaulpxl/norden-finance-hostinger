'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { AlertTriangle, CheckCircle2, Copy, Link2, Loader2, RotateCcw, ShieldCheck, Smartphone, Zap } from 'lucide-react';
import { getShortcutEndpoint, regenerateShortcutToken } from '../app/actions';
import { getPublicAppUrl } from '../lib/appUrl';

type GuideStep = {
  title: string;
  body: React.ReactNode;
};

const appUrl = getPublicAppUrl();

function EndpointBox({
  endpoint,
  copied,
  disabled,
  onCopy,
}: {
  endpoint: string;
  copied: boolean;
  disabled: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mt-3 space-y-3">
      <div className="min-h-20 border-[2px] border-black bg-black p-3 font-mono text-[11px] font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] break-all">
        {endpoint}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onCopy}
        className="inline-flex min-h-10 items-center gap-2 border-[2px] border-black bg-[#FFE066] px-3 py-2 text-xs font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Tersalin' : 'Salin URL'}
      </button>
    </div>
  );
}

function GuideCard({
  icon,
  title,
  description,
  steps,
  endpoint,
  copied,
  copyDisabled,
  onCopy,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  steps: GuideStep[];
  endpoint: string;
  copied: boolean;
  copyDisabled: boolean;
  onCopy: () => void;
}) {
  return (
    <section className="border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:p-6">
      <div className="mb-5 flex items-center gap-4 border-b-[3px] border-black pb-4">
        <div className="border-[2px] border-black bg-[#f3f4f6] p-2.5 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {icon}
        </div>
        <h3 className="text-base font-black uppercase tracking-wider text-black">{title}</h3>
      </div>

      {description && (
        <p className="mb-5 border-[2px] border-black bg-[#f3f4f6] p-4 text-sm font-bold leading-relaxed text-neutral-700">
          {description}
        </p>
      )}

      <ol className="space-y-5">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center border-[2px] border-black bg-black text-xs font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm font-black text-black">{step.title}</p>
              <div className="mt-1 text-sm font-semibold leading-relaxed text-neutral-700">{step.body}</div>
              {step.title === 'Masukkan endpoint Norden' && (
                <EndpointBox endpoint={endpoint} copied={copied} disabled={copyDisabled} onCopy={onCopy} />
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Integrations() {
  const [endpoint, setEndpoint] = useState('');
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const displayEndpoint = endpoint || `${appUrl}/api/shortcut?token=memuat-token-aman`;
  const copyDisabled = !endpoint || isLoading || isPending;

  useEffect(() => {
    let active = true;

    void getShortcutEndpoint()
      .then((response) => {
        if (!active) return;
        if (response.success && response.endpoint) {
          setEndpoint(response.endpoint);
          setError('');
        } else {
          setError(response.error || 'Gagal memuat endpoint shortcut.');
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat endpoint shortcut.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const guideSections = useMemo(() => {
    const iosSteps: GuideStep[] = [
      { title: 'Buka Shortcuts', body: 'Di iPhone, buat shortcut baru untuk mencatat transaksi dengan input teks.' },
      { title: 'Tambahkan Ask for Input', body: 'Pakai prompt seperti "Pengeluaran hari ini?" agar input tetap cepat dan konsisten.' },
      { title: 'Masukkan endpoint Norden', body: 'Tambahkan action URL, lalu tempel endpoint pribadi di bawah ini.' },
      {
        title: 'Kirim sebagai POST JSON',
        body: (
          <>
            Tambahkan action Get Contents of URL, pilih method POST, header <strong>Content-Type: application/json</strong>, dan body JSON <strong>{'{"text":"[Provided Input]"}'}</strong>.
          </>
        ),
      },
      { title: 'Simpan shortcut', body: 'Panggil lewat Siri atau widget, lalu ucapkan contoh seperti "50 ribu makan BCA".' },
    ];

    const androidSteps: GuideStep[] = [
      { title: 'Buka HTTP Shortcuts', body: 'Buat shortcut baru bertipe HTTP Request di aplikasi HTTP Shortcuts.' },
      { title: 'Buat variable text', body: 'Tambahkan variable User Input bernama text dengan prompt seperti "Catat pengeluaran apa?".' },
      { title: 'Masukkan endpoint Norden', body: 'Pilih method POST, tempel endpoint pribadi, dan pakai header Content-Type application/json.' },
      { title: 'Isi body request', body: <span>Pakai JSON <strong>{'{"text":"{{text}}"}'}</strong> agar input dikirim ke Norden.</span> },
      { title: 'Pasang widget', body: 'Simpan shortcut dan tambahkan ke Home Screen untuk mencatat transaksi dari layar utama.' },
    ];

    const nfcSteps: GuideStep[] = [
      { title: 'Siapkan shortcut utama', body: 'Buat shortcut iOS atau Android terlebih dahulu, lalu pastikan endpoint pribadi sudah tersimpan.' },
      { title: 'Program stiker NFC', body: 'Di iOS pakai Automation NFC. Di Android pakai NFC Tools untuk memicu shortcut yang sudah dibuat.' },
      { title: 'Masukkan endpoint Norden', body: 'Jika aplikasi NFC meminta URL langsung, gunakan endpoint pribadi di bawah ini.' },
      { title: 'Tes dengan nominal kecil', body: 'Coba input sederhana seperti "10 ribu parkir cash" dan cek apakah transaksi masuk ke dashboard.' },
    ];

    return [
      {
        key: 'ios',
        title: 'Setup iOS Shortcuts',
        icon: <Smartphone className="h-5 w-5 stroke-[2.5px]" />,
        steps: iosSteps,
      },
      {
        key: 'android',
        title: 'Setup Android Shortcuts',
        icon: <Smartphone className="h-5 w-5 stroke-[2.5px]" />,
        steps: androidSteps,
      },
      {
        key: 'nfc',
        title: 'NFC Sticker Trigger',
        icon: <Zap className="h-5 w-5 stroke-[2.5px]" />,
        description: 'Stiker NFC bisa dipakai sebagai pemicu cepat. Token endpoint tetap pribadi, jadi reset token jika URL pernah dibagikan atau perangkat hilang.',
        steps: nfcSteps,
      },
    ] as const;
  }, []);

  function copyEndpoint(key: string) {
    if (!endpoint) return;

    void navigator.clipboard.writeText(endpoint).then(() => {
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(''), 1800);
    });
  }

  function resetToken() {
    startTransition(async () => {
      setError('');
      const response = await regenerateShortcutToken();

      if (response.success && response.endpoint) {
        setEndpoint(response.endpoint);
        setCopiedKey('');
      } else {
        setError(response.error || 'Gagal reset token shortcut.');
      }
    });
  }

  return (
    <div className="max-w-7xl select-none space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-black uppercase tracking-wider text-black">Integrasi Mobile Shortcuts & NFC</h2>
          <p className="max-w-2xl text-sm font-bold leading-relaxed text-neutral-600">
            Catat transaksi dari Siri, widget Android, atau stiker NFC. Endpoint di halaman ini sudah memakai token pribadi, sehingga bisa dipakai dari shortcut mobile tanpa cookie browser.
          </p>
        </div>
        <button
          type="button"
          onClick={resetToken}
          disabled={isPending || isLoading}
          className="inline-flex min-h-11 items-center justify-center gap-2 border-[3px] border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-[#FFE066] disabled:cursor-not-allowed disabled:opacity-50 lg:self-start"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Reset Token
        </button>
      </div>

      <div className="border-[3px] border-black bg-[#bbf7d0] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-black" />
          <div className="min-w-0">
            <p className="text-sm font-black text-black">Endpoint pribadi aktif</p>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-emerald-950">
              Gunakan URL ini hanya di perangkat Anda. Reset token akan membuat semua shortcut lama tidak bisa dipakai sampai URL baru dipasang.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-950">
              <Link2 className="h-4 w-4 shrink-0" />
              <span className="break-all">{isLoading ? 'Memuat endpoint aman...' : displayEndpoint}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="border-[3px] border-black bg-red-100 p-4 text-sm font-bold text-red-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        {guideSections.map((section) => (
          <GuideCard
            key={section.key}
            icon={section.icon}
            title={section.title}
            description={'description' in section ? section.description : undefined}
            steps={section.steps}
            endpoint={displayEndpoint}
            copied={copiedKey === section.key}
            copyDisabled={copyDisabled}
            onCopy={() => copyEndpoint(section.key)}
          />
        ))}
      </div>
    </div>
  );
}

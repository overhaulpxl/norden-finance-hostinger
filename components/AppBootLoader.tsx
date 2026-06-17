'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import BrandLogo from './BrandLogo';
import { CRITICAL_ASSETS } from '../lib/criticalAssets';

const BOOT_TIMEOUT_MS = 4500;

type BootTask = {
  key: string;
  label: string;
  run: () => Promise<void>;
};

function withTimeout(task: Promise<void>, timeoutMs: number) {
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, timeoutMs);
    task.finally(() => {
      window.clearTimeout(timeout);
      resolve();
    });
  });
}

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const image = new window.Image();
    let resolved = false;

    const finish = async () => {
      if (resolved) return;
      resolved = true;
      try {
        if (typeof image.decode === 'function') {
          await image.decode();
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Critical image decode failed for ${src}:`, error);
        }
      } finally {
        resolve();
      }
    };

    image.onload = finish;

    image.onerror = () => {
      if (resolved) return;
      resolved = true;
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Critical image failed to load: ${src}`);
      }
      resolve();
    };

    image.src = src;
    if (image.complete) {
      void finish();
    }
  });
}

async function waitForFonts() {
  const fontSet = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
  if (!fontSet?.ready) return;
  await fontSet.ready;
}

async function waitForAuthState() {
  const [{ onAuthStateChanged }, { auth }] = await Promise.all([
    import('firebase/auth'),
    import('../lib/firebase'),
  ]);

  await new Promise<void>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      unsubscribe();
      resolve();
    }, () => {
      unsubscribe();
      resolve();
    });
  });
}

function routeNeedsAuthReadiness(pathname: string | null) {
  if (!pathname) return false;
  return [
    '/auth',
    '/dashboard',
    '/forgot-password',
    '/login',
    '/norden-control-center',
    '/onboarding',
    '/register',
    '/upgrade',
    '/verify-email',
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function AppBootLoader() {
  const pathname = usePathname();
  const [completed, setCompleted] = useState(0);
  const [ready, setReady] = useState(false);

  const tasks = useMemo<BootTask[]>(() => {
    const bootTasks: BootTask[] = [
      ...CRITICAL_ASSETS.map((src) => ({
        key: src,
        label: src.includes('horizontal') ? 'Brand wordmark' : 'Brand icon',
        run: () => preloadImage(src),
      })),
      {
        key: 'fonts',
        label: 'Fonts',
        run: waitForFonts,
      },
    ];

    if (routeNeedsAuthReadiness(pathname)) {
      bootTasks.push({
        key: 'auth',
        label: 'Auth session',
        run: waitForAuthState,
      });
    }

    return bootTasks;
  }, [pathname]);

  useEffect(() => {
    let active = true;
    setCompleted(0);
    setReady(false);

    const markDone = () => {
      if (!active) return;
      setCompleted((current) => Math.min(current + 1, tasks.length));
    };

    const boot = Promise.all(tasks.map((task) => task.run().catch((error) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Boot readiness task failed: ${task.label}`, error);
      }
    }).finally(markDone))).then(() => undefined);

    withTimeout(boot, BOOT_TIMEOUT_MS).then(() => {
      if (active) setReady(true);
    });

    return () => {
      active = false;
    };
  }, [tasks]);

  if (ready) return null;

  const total = Math.max(tasks.length, 1);
  const progress = Math.max(8, Math.round((completed / total) * 100));
  const currentTask = tasks[Math.min(completed, tasks.length - 1)]?.label || 'Norden';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#FAF9F5] p-4 text-black">
      <div className="w-full max-w-sm border-[3px] border-black bg-white p-7 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="mb-6 flex items-center justify-center">
          <BrandLogo variant="horizontal" priority className="h-12 w-auto" />
        </div>
        <div className="mb-3 flex items-center justify-between gap-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">
          <span>Loading</span>
          <span>{progress}%</span>
        </div>
        <div className="h-4 border-[2px] border-black bg-[#FAF9F5]">
          <div
            className="h-full border-r-[2px] border-black bg-[#FFE066] transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-4 truncate text-center text-[11px] font-black uppercase tracking-wider text-black">
          {currentTask}
        </p>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeyRound, RefreshCw } from 'lucide-react';
import { getCode, setCode } from '@/lib/access';
import { cn } from '@/lib/utils';

interface Status {
  codeRequired: boolean;
  codeOk: boolean;
  eleven: boolean;
  voices: { teacher: boolean; girl: boolean; boy: boolean };
  ai: boolean;
  usage?: { used: number | null; limit: number | null; tier: string | null; resetsAt: number | null; cloning: boolean | null };
}

/**
 * Which mode the site runs in, and how much free credit is left. On a free
 * plan that number is the one that matters: about 10 000 characters a month,
 * and every spoken line spends some.
 */
export function StatusBar() {
  const [status, setStatus] = useState<Status | null>(null);
  const [code, setCodeInput] = useState('');
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    setChecking(true);
    try {
      const c = getCode();
      const res = await fetch('/api/status', { headers: c ? { 'x-access-code': c } : {}, cache: 'no-store' });
      if (res.ok) setStatus(await res.json());
    } catch {
      // Offline or the server is down: the page still loads its lessons.
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => document.visibilityState === 'visible' && load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  if (!status) return null;

  const needsCode = status.codeRequired && !status.codeOk;
  const u = status.usage;
  const pct = u?.used != null && u?.limit ? Math.min(100, Math.round((u.used / u.limit) * 100)) : null;
  const left = u?.used != null && u?.limit != null ? Math.max(0, u.limit - u.used) : null;
  const reset = u?.resetsAt ? new Date(u.resetsAt * 1000).toLocaleDateString('uz-UZ') : null;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold',
            status.eleven
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
          )}
        >
          {status.eleven ? 'ElevenLabs ulangan' : 'Bepul rejim (kalitsiz)'}
        </span>
        {status.eleven && u?.tier && (
          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
            Tarif: {u.tier}
          </span>
        )}
        {status.eleven && u?.cloning === false && (
          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-gray-600 dark:text-gray-400">
            Klonlash: pullik tarifda
          </span>
        )}
        <button
          onClick={load}
          className="ml-auto inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          aria-label="Holatni yangilash"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', checking && 'animate-spin')} /> Yangilash
        </button>
      </div>

      {status.eleven && pct !== null && (
        <div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Oylik kredit: {u!.used!.toLocaleString('uz-UZ')} / {u!.limit!.toLocaleString('uz-UZ')} belgi ishlatildi</span>
            <span className="tabular-nums">{left!.toLocaleString('uz-UZ')} qoldi</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className={cn('h-full rounded-full', pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500')}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Bir qator taxminan 20–60 belgi sarflaydi. Bir marta eshittirilgan qator qayta eshittirilganda yoki
            birlashtirilganda kredit sarflanmaydi.{reset ? ` Kredit ${reset} da yangilanadi.` : ''}
          </p>
        </div>
      )}

      {!status.eleven && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Hozir bepul ovoz ishlatilyapti. Pullik bilan bir xil sifatni sinash uchun ElevenLabs bepul kalitini qoʻying
          (README’da yozilgan).
        </p>
      )}

      {needsCode && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setCode(code.trim());
            load();
          }}
        >
          <KeyRound className="w-4 h-4 text-gray-500" />
          <label htmlFor="access-code" className="text-gray-700 dark:text-gray-300">
            Kirish kodi:
          </label>
          <input
            id="access-code"
            type="password"
            value={code}
            onChange={(e) => setCodeInput(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-1.5"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700">
            Kirish
          </button>
          {getCode() && <span className="text-xs text-red-600 dark:text-red-400">Kod notoʻgʻri.</span>}
        </form>
      )}
    </div>
  );
}

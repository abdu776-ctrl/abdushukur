'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useEscapeKey } from '@/lib/hooks';
import { Languages, X, ArrowRight, ArrowLeftRight, Loader2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Lang = { code: string; label: string; flag: string };

const LANGS: Lang[] = [
  { code: 'auto', label: 'Auto-detect', flag: '🌐' },
  { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
];

const TARGET_LANGS = LANGS.filter((l) => l.code !== 'auto');

interface NameTranslatorProps {
  label: string;
  fullName: string;
  koreanName: string;
  onApplyFullName: (v: string) => void;
  onApplyKorean: (v: string) => void;
}

export function NameTranslator({
  label,
  fullName,
  koreanName,
  onApplyFullName,
  onApplyKorean,
}: NameTranslatorProps) {
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  useEscapeKey(() => setOpen(false), open);
  const [source, setSource] = useState('');
  const [from, setFrom] = useState('auto');
  const [to, setTo] = useState('ko');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Prefill source with whichever name is already filled when opening.
  useEffect(() => {
    if (open) {
      const initial = fullName.trim() || koreanName.trim();
      setSource(initial);
      setResult('');
      setError('');
      // If the Korean field is the one filled, default direction ko -> en.
      if (!fullName.trim() && koreanName.trim()) {
        setFrom('ko');
        setTo('en');
      } else {
        setFrom('auto');
        setTo('ko');
      }
    }
  }, [open, fullName, koreanName]);

  async function doTranslate(text: string, f: string, t: string) {
    if (!text.trim()) {
      setResult('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, from: f, to: t, mode: 'name' }),
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setResult((data.translated as string) || '');
    } catch {
      setError('Tarjima xizmatida xatolik. Qayta urinib koʻring.');
    } finally {
      setLoading(false);
    }
  }

  function swap() {
    // Can't swap out of auto — pick a concrete source first.
    const newFrom = to;
    const newTo = from === 'auto' ? 'en' : from;
    setFrom(newFrom);
    setTo(newTo);
    setSource(result);
    setResult(source);
  }

  function copyResult() {
    if (!result) return;
    navigator.clipboard?.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/30 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
      >
        <Languages className="w-3.5 h-3.5" />
        {label}
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{label}</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={tc('close')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language pickers */}
            <div className="flex items-center gap-2 px-5 pt-4">
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={swap}
                title="Swap"
                className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>

              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TARGET_LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Source + result */}
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Matn / Text
                </label>
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Ism familiya..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') doTranslate(source, from, to);
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => doTranslate(source, from, to)}
                disabled={loading || !source.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Tarjima qilish
              </button>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Natija / Result
                </label>
                <div className="relative">
                  <input
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                    placeholder="—"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {result && (
                    <button
                      type="button"
                      onClick={copyResult}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
              </div>
            </div>

            {/* Apply buttons */}
            <div className="flex flex-col sm:flex-row gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                disabled={!result.trim()}
                onClick={() => {
                  onApplyFullName(result);
                  setOpen(false);
                }}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
                  'hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                → Full Name (A)
              </button>
              <button
                type="button"
                disabled={!result.trim()}
                onClick={() => {
                  onApplyKorean(result);
                  setOpen(false);
                }}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                → 한국어 이름
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

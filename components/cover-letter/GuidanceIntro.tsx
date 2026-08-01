'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Lightbulb } from 'lucide-react';
import { generalRules } from '@/lib/coverLetterGuidance';
import { useEscapeKey, useFocusTrap } from '@/lib/hooks';

/**
 * "Before you write" screen. Shown the first time (unless dismissed) and always
 * reopenable from the editor. onClose reports whether "don't show again" was on.
 */
export function GuidanceIntro({ onClose }: { onClose: (dontShowAgain: boolean) => void }) {
  const t = useTranslations('coverLetter');
  const tc = useTranslations('common');
  const [dontShow, setDontShow] = useState(true);
  const rules = generalRules();
  useEscapeKey(() => onClose(dontShow));
  const trapRef = useFocusTrap<HTMLDivElement>();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onClose(dontShow)} />

      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guidance-intro-title"
        className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-slide-up"
        style={{ maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 id="guidance-intro-title" className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            {t('intro.title')}
          </h2>
          <button
            onClick={() => onClose(dontShow)}
            aria-label={tc('close')}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('intro.subtitle')}</p>
          <ul className="space-y-3">
            {rules.map((rule, i) => (
              <li key={rule.id} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t(rule.titleKey)}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">{t(rule.bodyKey)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
            />
            {t('intro.dontShowAgain')}
          </label>
          <button
            onClick={() => onClose(dontShow)}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {t('intro.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';

/**
 * Shown when the browser refuses to store the local draft.
 *
 * The draft is what protects an hour of typing from a refresh or a crash. When
 * it silently stops working — storage full, private window, cookies blocked —
 * the person carries on believing they are covered, and only finds out when the
 * work is already gone. So it is said plainly, and it stays on screen: this is
 * a standing condition, not a passing event that a toast could carry.
 */
export function DraftWarning() {
  const t = useTranslations('common');

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 print:hidden"
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
        {t('draftBlocked')}
      </p>
    </div>
  );
}

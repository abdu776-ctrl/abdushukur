'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { WifiOff } from 'lucide-react';

/**
 * Tells people the connection is gone, and — more usefully — what still works
 * without it. Losing the network used to show up only as an AI request that
 * quietly failed; the builder itself keeps working, because drafts live in this
 * browser, and that is worth saying out loud.
 */
export function OfflineBanner() {
  const t = useTranslations('network');
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Read the value on mount rather than during render: the server has no
    // navigator, and starting at `false` keeps the markup identical either way.
    setOffline(!navigator.onLine);

    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 shadow-lg print:hidden"
    >
      <div className="flex items-start gap-3">
        <WifiOff className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{t('offline')}</p>
          <p className="text-xs mt-0.5 text-amber-700 dark:text-amber-300/80">{t('offlineHint')}</p>
        </div>
      </div>
    </div>
  );
}

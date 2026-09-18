'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { onBackButton, exitApp } from '@/lib/native';

/**
 * Gives Android's back button the behaviour people expect: step back through
 * the pages you came from, and only leave the app from the first screen — and
 * even then, only if you mean it.
 *
 * Without this the shell closes outright on the first tap, from any screen. On
 * a page where someone has spent twenty minutes on a resume, that is the worst
 * possible response to an ambiguous gesture.
 *
 * Renders nothing in a browser, where there is no hardware back button to
 * listen to.
 */
export function NativeBackButton() {
  const t = useTranslations('network');
  const [confirming, setConfirming] = useState(false);
  // Read in the listener, which is registered once and must not go stale.
  const confirmingRef = useRef(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const unsubscribe = onBackButton((canGoBack) => {
      if (canGoBack) {
        window.history.back();
        return;
      }

      // At the first screen. One tap arms it, a second within two seconds
      // leaves — the Android convention, and a cheap guard against an
      // accidental swipe throwing away unsaved work.
      if (confirmingRef.current) {
        void exitApp();
        return;
      }

      confirmingRef.current = true;
      setConfirming(true);
      timers.push(
        setTimeout(() => {
          confirmingRef.current = false;
          setConfirming(false);
        }, 2000)
      );
    });

    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, []);

  if (!confirming) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-gray-900/90 dark:bg-gray-100/90 px-4 py-2 text-xs font-medium text-white dark:text-gray-900 shadow-lg print:hidden"
    >
      {t('exitConfirm')}
    </div>
  );
}

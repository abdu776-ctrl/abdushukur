'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker that gives the app an offline fallback instead
 * of a blank error page. Renders nothing.
 *
 * Registration is deliberately deferred until after load: it competes with the
 * page's own requests otherwise, and nothing on a first visit needs it.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // A worker registered by `next dev` would serve stale chunks after every
    // edit, so it is only wired up in a real build.
    if (process.env.NODE_ENV !== 'production') return;

    function register() {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        // Not fatal: the app works, it just has no offline fallback. Private
        // windows and some embedded WebViews refuse registration outright.
        console.error('service worker registration failed:', err);
      });
    }

    if (document.readyState === 'complete') register();
    else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}

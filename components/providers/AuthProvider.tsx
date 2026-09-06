'use client';

// Auth state comes from Supabase via useAuth(), which manages its own listener,
// so no session provider is needed. What this does own is the native shell's
// side of Google sign-in: when Custom Tabs hands the app back through a deep
// link, the session has to be installed here.

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { completeNativeSignIn } from '@/lib/useAuth';
import { onAppUrlOpen, closeExternal } from '@/lib/native';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  useEffect(() => {
    // Outside the native shell this subscribes to nothing and costs nothing.
    return onAppUrlOpen((url) => {
      if (!url.includes('access_token') && !url.includes('code=')) return;
      void completeNativeSignIn(url).then((ok) => {
        void closeExternal();
        if (ok) window.location.href = `/${locale}/dashboard`;
      });
    });
  }, [locale]);

  return <>{children}</>;
}

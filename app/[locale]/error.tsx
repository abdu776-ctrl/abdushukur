'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ErrorScreen } from '@/components/errors/ErrorScreen';

/**
 * Catches unexpected errors inside a locale. Previously any thrown error
 * produced Next's own English screen, which told the user nothing and offered
 * no way back.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');
  const locale = useLocale();

  useEffect(() => {
    console.error('unhandled error:', error);
  }, [error]);

  return (
    <ErrorScreen
      title={t('errorTitle')}
      body={t('errorBody')}
      homeHref={`/${locale}`}
      homeLabel={t('goHome')}
      onRetry={reset}
      retryLabel={t('retry')}
    />
  );
}

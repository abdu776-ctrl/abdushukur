import { getTranslations } from 'next-intl/server';
import { ErrorScreen } from '@/components/errors/ErrorScreen';
import { routing } from '@/lib/routing';

/**
 * 404 inside a locale. Without this Next served its own English default page,
 * with no branding and no way back, in every language.
 *
 * `params` is not available to not-found, so the copy uses the default locale
 * for the rare case where the URL carries no usable one.
 */
export default async function LocaleNotFound() {
  const t = await getTranslations({ locale: routing.defaultLocale });

  return (
    <ErrorScreen
      code="404"
      title={t('errors.notFoundTitle')}
      body={t('errors.notFoundBody')}
      homeHref={`/${routing.defaultLocale}`}
      homeLabel={t('errors.goHome')}
    />
  );
}

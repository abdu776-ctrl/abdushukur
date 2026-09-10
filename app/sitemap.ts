import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n';
import { SITE_URL } from '@/lib/siteUrl';

/** Pages worth indexing. The builders, dashboard and settings need an account,
 *  so they are deliberately left out. */
const PUBLIC_PATHS = ['', '/privacy', '/terms', '/auth/login', '/auth/register'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return locales.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: now,
      changeFrequency: path === '' ? ('weekly' as const) : ('monthly' as const),
      priority: path === '' ? 1 : 0.6,
      // Tell search engines these are the same page in six languages, so they
      // serve the right one instead of treating them as duplicates.
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}${path}`])
        ),
      },
    }))
  );
}

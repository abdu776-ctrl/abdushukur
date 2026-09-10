import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/siteUrl';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Signed-in areas hold personal documents and have nothing to index.
      disallow: ['/api/', '/*/dashboard', '/*/settings', '/*/documents', '/*/auth/reset-password'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

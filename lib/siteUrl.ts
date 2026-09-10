// Canonical origin used for canonical links, hreflang, sitemap and share cards.
//
// This used to fall back to a hardcoded "koreer.vercel.app", which is not where
// the app is served from — so every page told search engines its canonical
// address was a different domain, and every shared link pointed at the wrong
// host.
//
// Order of preference:
//   1. NEXT_PUBLIC_SITE_URL — set this once you have a real domain.
//   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel provides the production hostname
//      automatically, so a deploy is correct without any configuration.
//   3. localhost, for development.

function normalize(url: string): string {
  const withScheme = url.startsWith('http') ? url : `https://${url}`;
  return withScheme.replace(/\/+$/, '');
}

export const SITE_URL = normalize(
  process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    'http://localhost:3000'
);

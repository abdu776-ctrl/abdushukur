import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

/**
 * Security headers. The app had none, so any site could put Koreer in an
 * iframe and collect what people typed into it.
 *
 * There is deliberately no Content-Security-Policy yet: the resume preview and
 * the print path use inline styles and data: URLs, so a policy strict enough to
 * be worth having would need testing against every export route first.
 */
const securityHeaders = [
  // No framing at all — nothing here is meant to be embedded.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  // Do not let a browser guess a type we did not send.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Send the origin, never the full path, to other sites.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Nothing here needs these, so deny them outright.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Once served over HTTPS, insist on it.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);

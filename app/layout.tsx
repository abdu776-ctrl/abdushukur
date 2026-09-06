import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Canonical site URL for share metadata. Set NEXT_PUBLIC_SITE_URL in the
// environment (e.g. https://koreer.vercel.app); falls back to the live domain.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://koreer.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Koreer — AI Career Assistant for Korea',
    template: '%s | Koreer',
  },
  description:
    'Create professional Korean resumes and self-introduction letters with AI assistance. Designed for international students.',
  keywords: [
    'Korean resume',
    '이력서',
    '자기소개서',
    'Korea job',
    'international student',
    'AI career',
  ],
  authors: [{ name: 'Koreer' }],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Koreer',
    statusBarStyle: 'default',
  },
  openGraph: {
    // og:url and og:locale are set per-locale in app/[locale]/layout.tsx
    type: 'website',
    siteName: 'Koreer',
    title: 'Koreer — AI Career Assistant for Korea',
    description:
      'Create professional Korean resumes and self-introduction letters with AI assistance.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Koreer — AI Career Assistant for Korea',
    description:
      'Create professional Korean resumes and self-introduction letters with AI assistance.',
  },
};

// Matches the manifest's theme_color, per colour scheme, so an installed app
// paints its own chrome instead of borrowing the browser default.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f11' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head />
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

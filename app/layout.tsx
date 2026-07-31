import type { Metadata } from 'next';
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

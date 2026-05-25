import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
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
    type: 'website',
    locale: 'en_US',
    url: 'https://koreer.app',
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

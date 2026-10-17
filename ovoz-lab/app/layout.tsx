import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/uz.json';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ovoz Lab — koreys tili ustozi va bola',
  description:
    'Ayol ustoz koreyscha soʻraydi, Oʻzbekistondan kelgan 6–14 yoshli bola javob beradi: aksent bilan yoki ravon 존댓말 bilan. Ovozni klonlash, almashtirish va dialogni saqlash.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = { themeColor: '#4f46e5', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
        <NextIntlClientProvider locale="uz" messages={messages} timeZone="Asia/Seoul">
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

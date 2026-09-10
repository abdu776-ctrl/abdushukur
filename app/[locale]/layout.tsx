import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/lib/i18n';
import type { Metadata } from 'next';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://koreer.vercel.app';
const OG_LOCALE: Record<string, string> = {
  en: 'en_US', ko: 'ko_KR', uz: 'uz_UZ', ru: 'ru_RU', zh: 'zh_CN', vi: 'vi_VN',
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Per-locale title and description — otherwise every language was announced
  // to search engines and link previews in English.
  const title = t('common.tagline');
  const description = t('home.hero.subtitle');

  return {
    // `default` is used by pages without their own title; `template` has to be
    // restated here, because a nested layout that sets a title stops inheriting
    // the parent's template for its own children.
    title: { default: title, template: '%s | Koreer' },
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: Object.fromEntries(
        locales.map((l) => [(OG_LOCALE[l] || 'en_US').replace('_', '-'), `${SITE_URL}/${l}`])
      ),
    },
    openGraph: {
      url: `${SITE_URL}/${locale}`,
      locale: OG_LOCALE[locale] || 'en_US',
      title,
      description,
    },
    twitter: { title, description },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>{children}</AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

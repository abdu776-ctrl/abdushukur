import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ko', 'uz', 'ru', 'zh', 'vi'],
  defaultLocale: 'en',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  uz: "Oʻzbek",
  ru: 'Русский',
  zh: '中文',
  vi: 'Tiếng Việt',
};

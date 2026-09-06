import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Sparkles } from 'lucide-react';
import { locales, localeNames, localeFlags } from '@/lib/i18n';
import { SUPPORT_EMAIL } from '@/lib/legal';

const COUNTRIES = [
  { key: 'uzbekistan', flag: '🇺🇿' },
  { key: 'kazakhstan', flag: '🇰🇿' },
  { key: 'kyrgyzstan', flag: '🇰🇬' },
  { key: 'mongolia', flag: '🇲🇳' },
  { key: 'vietnam', flag: '🇻🇳' },
];

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale });
  const currentYear = new Date().getFullYear();

  // Every link here goes somewhere real — a footer full of href="#" is worse
  // than a shorter footer.
  const productLinks = [
    { href: `/${locale}/resume`, label: t('nav.resume') },
    { href: `/${locale}/cover-letter`, label: t('nav.coverLetter') },
    { href: `/${locale}/ai-assistant`, label: t('nav.aiAssistant') },
    { href: `/${locale}/documents`, label: t('nav.documents') },
  ];

  return (
    <footer className="bg-gray-950 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Koreer</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">{t('footer.tagline')}</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">{t('footer.product')}</h4>
            <ul className="space-y-3 text-sm">
              {productLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Languages */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">{t('footer.languages')}</h4>
            <ul className="space-y-3 text-sm">
              {locales.map((l) => (
                <li key={l}>
                  <Link
                    href={`/${l}`}
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span>{localeFlags[l]}</span> {localeNames[l]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Where applicants come from */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">{t('footer.forStudents')}</h4>
            <ul className="space-y-3 text-sm">
              {COUNTRIES.map((c) => (
                <li key={c.key} className="flex items-center gap-2">
                  <span>{c.flag}</span> {t(`auth.register.countries.${c.key}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            {t('footer.copyright', { year: currentYear })}
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">
              {t('legal.privacy.title')}
            </Link>
            <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">
              {t('legal.terms.title')}
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white transition-colors">
              {t('footer.contact')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { SUPPORT_EMAIL, formatLegalDate } from '@/lib/legal';

/** One section: a heading plus one or more paragraphs. */
export interface LegalSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

/**
 * Shared shell for the Privacy Policy and Terms pages. The text itself lives in
 * the locale files, so all four languages stay in step.
 */
export async function LegalPage({
  locale,
  title,
  intro,
  sections,
  showContactEmail = true,
}: {
  locale: string;
  title: string;
  intro: string;
  sections: LegalSection[];
  showContactEmail?: boolean;
}) {
  const t = await getTranslations({ locale });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f11]">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href={`/${locale}`} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Koreer</span>
          </Link>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('legal.back')}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {t('legal.lastUpdated')}: {formatLegalDate(locale)}
        </p>
        <p className="text-gray-600 dark:text-gray-300 mt-6 leading-relaxed">{intro}</p>

        <div className="mt-10 space-y-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {section.title}
              </h2>
              {section.paragraphs.map((p) => (
                <p key={p} className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-300">
                  {section.bullets.map((b) => (
                    <li key={b} className="leading-relaxed">{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {showContactEmail && (
            <p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

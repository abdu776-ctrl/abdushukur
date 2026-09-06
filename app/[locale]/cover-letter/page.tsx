import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CoverLetterBuilder } from '@/components/cover-letter/CoverLetterBuilder';

export default async function CoverLetterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('coverLetter.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('coverLetter.subtitle')}
          </p>
        </div>
        {/* The builder reads ?doc= to reopen a saved letter, so it needs a
            Suspense boundary to stay prerenderable. */}
        <Suspense fallback={null}>
          <CoverLetterBuilder />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ResumeBuilder } from '@/components/resume/ResumeBuilder';

export default async function ResumePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('resume.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('resume.subtitle')}
          </p>
        </div>
        <ResumeBuilder />
      </div>
    </DashboardLayout>
  );
}

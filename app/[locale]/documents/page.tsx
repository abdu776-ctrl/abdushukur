import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DocumentsList } from '@/components/documents/DocumentsList';

export default async function DocumentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('documents.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('documents.subtitle')}
          </p>
        </div>
        <DocumentsList locale={locale} />
      </div>
    </DashboardLayout>
  );
}

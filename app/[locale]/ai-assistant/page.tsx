import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AIChat } from '@/components/ai/AIChat';

export default async function AIAssistantPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('aiAssistant.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('aiAssistant.subtitle')}
          </p>
        </div>
        <div className="flex-1 min-h-0">
          <AIChat />
        </div>
      </div>
    </DashboardLayout>
  );
}

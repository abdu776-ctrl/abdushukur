import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { VoiceLab } from '@/components/voice-lab/VoiceLab';

export default async function VoiceLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('voiceLab.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('voiceLab.subtitle')}</p>
        </div>
        <VoiceLab />
      </div>
    </DashboardLayout>
  );
}

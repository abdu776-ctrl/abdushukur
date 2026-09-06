import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalPage, type LegalSection } from '@/components/legal/LegalPage';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: `${t('legal.terms.title')} — Koreer` };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const p = (key: string) => t(`legal.terms.${key}`);

  const keys = [
    'service', 'account', 'acceptable', 'content', 'ai',
    'availability', 'termination', 'liability', 'changes', 'contact',
  ];

  const sections: LegalSection[] = keys.map((k) => ({
    title: p(`${k}.t`),
    paragraphs: [p(`${k}.b`)],
  }));

  return (
    <LegalPage
      locale={locale}
      title={p('title')}
      intro={p('intro')}
      sections={sections}
    />
  );
}

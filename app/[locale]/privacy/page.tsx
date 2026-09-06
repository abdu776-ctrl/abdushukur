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
  return { title: `${t('legal.privacy.title')} — Koreer` };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const p = (key: string) => t(`legal.privacy.${key}`);

  const sections: LegalSection[] = [
    {
      title: p('collect.t'),
      paragraphs: [],
      bullets: [p('collect.account'), p('collect.documents'), p('collect.profile'), p('collect.technical')],
    },
    { title: p('use.t'), paragraphs: [p('use.b')] },
    { title: p('ai.t'), paragraphs: [p('ai.b')] },
    {
      title: p('share.t'),
      paragraphs: [p('share.b')],
      bullets: [p('share.supabase'), p('share.vercel'), p('share.groq')],
    },
    { title: p('retention.t'), paragraphs: [p('retention.b')] },
    { title: p('rights.t'), paragraphs: [p('rights.b')] },
    { title: p('security.t'), paragraphs: [p('security.b')] },
    { title: p('children.t'), paragraphs: [p('children.b')] },
    { title: p('changes.t'), paragraphs: [p('changes.b')] },
    { title: p('contact.t'), paragraphs: [p('contact.b')] },
  ];

  return (
    <LegalPage
      locale={locale}
      title={p('title')}
      intro={p('intro')}
      sections={sections}
    />
  );
}

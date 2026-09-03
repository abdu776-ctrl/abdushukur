'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Briefcase, Save, Check } from 'lucide-react';
import { loadProfile, saveProfile, emptyProfile, type CareerProfile } from '@/lib/profile';

type FieldKey = keyof Omit<CareerProfile, 'updatedAt'>;

const FIELDS: { key: FieldKey; rows: number }[] = [
  { key: 'headline', rows: 2 },
  { key: 'skills', rows: 2 },
  { key: 'education', rows: 3 },
  { key: 'experience', rows: 4 },
  { key: 'languages', rows: 2 },
  { key: 'strengths', rows: 3 },
];

/**
 * Profile-level career background, entered once and reused by every document
 * and every AI request. Persists to localStorage.
 */
export function CareerProfileForm() {
  const t = useTranslations('careerProfile');
  const [profile, setProfile] = useState<CareerProfile>(emptyProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = loadProfile();
    if (stored) setProfile(stored);
  }, []);

  function patch(key: FieldKey, value: string) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setProfile(saveProfile(profile));
    setSaved(true);
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5 animate-fade-in">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-500" />
          {t('title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{t('subtitle')}</p>
      </div>

      <div className="space-y-4">
        {FIELDS.map(({ key, rows }) => (
          <Textarea
            key={key}
            label={t(`fields.${key}.label`)}
            placeholder={t(`fields.${key}.placeholder`)}
            value={profile[key]}
            rows={rows}
            onChange={(e) => patch(key, e.target.value)}
            className="resize-none"
          />
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="md"
          icon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          onClick={handleSave}
        >
          {saved ? t('saved') : t('save')}
        </Button>
      </div>
    </div>
  );
}

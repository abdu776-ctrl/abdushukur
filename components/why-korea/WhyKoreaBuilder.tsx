'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MapPin, Save, Wand2, Check } from 'lucide-react';
import {
  loadNarrative, saveNarrative, emptyNarrative, composeDraft,
  type WhyKoreaNarrative,
} from '@/lib/whyKorea';
import { syncNarrative, upsertProfileFields, narrativeToRow } from '@/lib/profileRemote';
import { useAuth } from '@/lib/useAuth';

/**
 * Profile-level guided builder for the "Why Korea" narrative. Persists to
 * localStorage. Never invents content — the draft is only ever the user's own
 * answers, stitched on request.
 */
export function WhyKoreaBuilder() {
  const t = useTranslations('whyKorea');
  const [n, setN] = useState<WhyKoreaNarrative>(emptyNarrative);
  const [saved, setSaved] = useState(false);

  const { status } = useAuth();

  useEffect(() => {
    const stored = loadNarrative();
    if (stored) setN(stored);
  }, []);

  // Once signed in, reconcile with the server copy so the narrative follows the
  // user across devices instead of living in one browser.
  useEffect(() => {
    if (status !== 'authenticated') return;
    let active = true;
    syncNarrative(loadNarrative()).then((remote) => {
      if (active && remote) {
        setN(remote);
        saveNarrative(remote);
      }
    });
    return () => {
      active = false;
    };
  }, [status]);

  function patch(p: Partial<WhyKoreaNarrative>) {
    setN((prev) => ({ ...prev, ...p }));
    setSaved(false);
  }

  const hasAnswers = !!(n.arrivalContext.trim() || n.alternativesWeighed.trim() || n.reasonToStay.trim());

  function combine() {
    const draft = composeDraft(n);
    if (draft) patch({ draftText: draft });
  }

  function handleSave() {
    const record = saveNarrative(n);
    setN(record);
    setSaved(true);
    if (status === 'authenticated') void upsertProfileFields(narrativeToRow(record));
  }

  const field = (
    key: 'arrivalContext' | 'alternativesWeighed' | 'reasonToStay',
  ) => (
    <Textarea
      label={t(`fields.${key}.label`)}
      placeholder={t(`fields.${key}.placeholder`)}
      value={n[key]}
      rows={2}
      onChange={(e) => patch({ [key]: e.target.value })}
      className="resize-none"
    />
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5 animate-fade-in">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-500" />
          {t('title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
      </div>

      <div className="space-y-4">
        {field('arrivalContext')}
        {field('alternativesWeighed')}
        {field('reasonToStay')}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('draft.label')}</label>
          <button
            type="button"
            onClick={combine}
            disabled={!hasAnswers}
            title={hasAnswers ? undefined : t('combineHint')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <Wand2 className="w-3.5 h-3.5" />
            {t('combine')}
          </button>
        </div>
        <Textarea
          placeholder={t('draft.placeholder')}
          value={n.draftText}
          rows={4}
          onChange={(e) => patch({ draftText: e.target.value })}
          className="resize-none"
        />
        {!hasAnswers && <p className="text-xs text-gray-400 dark:text-gray-500">{t('combineHint')}</p>}
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

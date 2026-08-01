'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, Lightbulb, Wrench, AlertTriangle, ListChecks, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { rulesForSection, type GuidanceSectionType, type GuidanceKind } from '@/lib/coverLetterGuidance';

const KIND_STYLE: Record<GuidanceKind, { icon: typeof Wrench; className: string }> = {
  formula:   { icon: Wrench,        className: 'text-indigo-600 dark:text-indigo-400' },
  mistake:   { icon: AlertTriangle, className: 'text-red-600 dark:text-red-400' },
  tip:       { icon: Lightbulb,     className: 'text-amber-600 dark:text-amber-400' },
  checklist: { icon: ListChecks,    className: 'text-green-600 dark:text-green-400' },
  example:   { icon: FileText,      className: 'text-sky-600 dark:text-sky-400' },
};

/**
 * Collapsible guidance for a single section, driven by the section TYPE. Open /
 * closed state is remembered per type in localStorage.
 */
export function GuidancePanel({ sectionType }: { sectionType: GuidanceSectionType }) {
  const t = useTranslations('coverLetter');
  const rules = rulesForSection(sectionType);
  const storageKey = `cl-guidance-open:${sectionType}`;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) setOpen(stored === 'true');
  }, [storageKey]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try { localStorage.setItem(storageKey, String(next)); } catch { /* ignore */ }
      return next;
    });
  }

  if (rules.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
          <Lightbulb className="w-4 h-4 flex-shrink-0" />
          {t('guidancePanel.title')}
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-amber-500 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2.5">
          {rules.map((rule) => {
            const style = KIND_STYLE[rule.kind];
            const Icon = style.icon;
            return (
              <div key={rule.id} className="text-xs">
                <div className={cn('flex items-center gap-1.5 font-semibold', style.className)}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{t(`kind.${rule.kind}`)}</span>
                  <span className="text-gray-400 dark:text-gray-500">·</span>
                  <span className="text-gray-700 dark:text-gray-200">{t(rule.titleKey)}</span>
                </div>
                <p className="mt-0.5 pl-5 text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {t(rule.bodyKey)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

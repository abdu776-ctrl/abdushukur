'use client';

import { X, CheckCircle2, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useEscapeKey } from '@/lib/hooks';
import { LAYOUTS, THEMES, getTheme, type LayoutId, type ThemeId, type Theme } from '@/lib/templates';

// ─── Mini preview components ─────────────────────────────────────────────────

function ModernPreview({ from, to }: { from: string; to: string }) {
  return (
    <div className="h-full flex flex-col" style={{ background: `linear-gradient(135deg,${from},${to})`, borderRadius: '6px 6px 0 0' }}>
      <div className="flex items-center gap-1.5 p-2">
        <div className="w-5 h-5 rounded-full bg-white/30 flex-shrink-0" />
        <div className="flex-1 space-y-0.5">
          <div className="h-1 bg-white/70 rounded w-3/4" />
          <div className="h-0.5 bg-white/40 rounded w-1/2" />
        </div>
      </div>
      <div className="flex-1 flex gap-1.5 p-2 bg-white/10 rounded-b">
        <div className="w-1/3 space-y-1">
          {[80, 60, 90, 50].map((w, i) => <div key={i} className="h-0.5 bg-white/40 rounded" style={{ width: `${w}%` }} />)}
        </div>
        <div className="flex-1 space-y-1">
          {[100, 80, 100, 70, 90].map((w, i) => <div key={i} className="h-0.5 bg-white/40 rounded" style={{ width: `${w}%` }} />)}
        </div>
      </div>
    </div>
  );
}

function KoreanPreview({ accent, photo = true }: { accent: string; photo?: boolean }) {
  return (
    <div className="h-full bg-white rounded-t flex flex-col p-2 gap-1">
      <div className="text-center h-2 rounded w-16 mx-auto" style={{ background: accent }} />
      <div className="flex gap-1.5 mt-1">
        {photo && (
          <div className="w-6 h-9 rounded border-2 border-gray-200 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
          </div>
        )}
        <div className="flex-1 space-y-0.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-0.5">
              <div className="w-1/3 h-1.5 rounded border border-gray-200 bg-gray-100" />
              <div className="flex-1 h-1.5 rounded border border-gray-200 bg-white" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 border-t-2 border-gray-800">
        {[100, 80, 100].map((w, i) => (
          <div key={i} className="flex gap-0.5 mt-0.5">
            <div className="w-1/4 h-1 rounded bg-gray-100 border border-gray-200" style={{ width: `${w / 4}%` }} />
            <div className="flex-1 h-1 rounded bg-white border border-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassicPreview({ accent }: { accent: string }) {
  return (
    <div className="h-full bg-white rounded-t p-2 flex flex-col">
      <div className="text-center pb-1 border-b-2" style={{ borderColor: accent }}>
        <div className="h-2 rounded w-20 mx-auto mb-0.5" style={{ background: accent }} />
        <div className="h-1 rounded w-28 mx-auto bg-gray-200" />
      </div>
      <div className="mt-1.5 space-y-1.5 flex-1">
        {[0, 1, 2].map((s) => (
          <div key={s}>
            <div className="h-0.5 w-full" style={{ background: accent, opacity: 0.7 }} />
            <div className="h-0.5 bg-gray-200 rounded w-3/4 mt-0.5" />
            <div className="h-0.5 bg-gray-200 rounded w-1/2 mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MinimalPreview({ accent }: { accent: string }) {
  return (
    <div className="h-full bg-white rounded-t p-2 flex flex-col gap-1">
      <div className="h-3 rounded w-24" style={{ background: accent, opacity: 0.9 }} />
      <div className="h-1 bg-gray-200 rounded w-16" />
      <div className="flex gap-2 mt-0.5">
        <div className="h-0.5 bg-gray-300 rounded w-10" />
        <div className="h-0.5 bg-gray-300 rounded w-8" />
      </div>
      <div className="mt-1.5 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-0.5 w-10 rounded mb-0.5" style={{ background: accent, opacity: 0.5 }} />
            <div className="h-0.5 bg-gray-200 rounded w-full" />
            <div className="h-0.5 bg-gray-200 rounded w-5/6 mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarPreview({ sideColor }: { sideColor: string }) {
  return (
    <div className="h-full flex rounded-t overflow-hidden">
      <div className="w-1/3 flex flex-col items-center gap-1 p-1.5" style={{ background: sideColor }}>
        <div className="w-6 h-6 rounded-full bg-white/30 mt-1" />
        <div className="space-y-0.5 w-full mt-1">
          {[80, 60, 90, 70].map((w, i) => <div key={i} className="h-0.5 bg-white/40 rounded" style={{ width: `${w}%` }} />)}
        </div>
      </div>
      <div className="flex-1 bg-white p-1.5 space-y-1">
        <div className="h-1.5 bg-gray-800 rounded w-3/4" />
        <div className="h-0.5 bg-gray-200 rounded" />
        <div className="h-0.5 bg-gray-200 rounded w-5/6" />
        <div className="h-0.5 bg-gray-200 rounded w-4/6" />
        <div className="h-0.5 bg-gray-100 rounded mt-1" />
        <div className="h-0.5 bg-gray-200 rounded" />
        <div className="h-0.5 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

function DarkPreview({ accent }: { accent: string }) {
  return (
    <div className="h-full rounded-t flex flex-col" style={{ background: '#0f0f1a' }}>
      <div className="p-2 border-b" style={{ borderColor: `${accent}55` }}>
        <div className="h-2 rounded w-20" style={{ background: accent }} />
        <div className="h-0.5 rounded w-16 mt-0.5" style={{ background: `${accent}66` }} />
      </div>
      <div className="flex-1 p-2 space-y-1">
        {[100, 80, 100, 60, 90].map((w, i) => (
          <div key={i} className="h-0.5 rounded opacity-40" style={{ width: `${w}%`, background: i === 0 ? accent : '#e2e8f0' }} />
        ))}
      </div>
    </div>
  );
}

function TechPreview({ accent }: { accent: string }) {
  return (
    <div className="h-full rounded-t flex flex-col" style={{ background: '#0d1117' }}>
      <div className="p-2">
        <div className="text-[6px] font-mono" style={{ color: accent }}>$ whoami</div>
        <div className="h-1.5 rounded w-16 mt-0.5" style={{ background: accent, opacity: 0.8 }} />
        <div className="text-[5px] font-mono mt-0.5" style={{ color: '#7ee787' }}>→ dev · seoul</div>
      </div>
      <div className="flex-1 border-t border-gray-700/50 p-1.5 space-y-1">
        {[[accent, 70], ['#58a6ff', 90], ['#7ee787', 60]].map(([c, w], i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full" style={{ background: c as string }} />
            <div className="h-0.5 rounded bg-gray-600" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AcademicPreview({ accent }: { accent: string }) {
  return (
    <div className="h-full bg-white rounded-t p-2 flex flex-col">
      <div className="border-b pb-1" style={{ borderColor: accent }}>
        <div className="h-2 rounded w-24 mb-0.5" style={{ background: accent }} />
        <div className="h-0.5 bg-gray-400 rounded w-16" />
      </div>
      <div className="mt-1 flex gap-2 flex-1">
        <div className="flex-1 space-y-1">
          <div className="h-0.5 rounded w-12" style={{ background: accent }} />
          {[100, 80, 90].map((w, i) => <div key={i} className="h-0.5 bg-gray-200 rounded" style={{ width: `${w}%` }} />)}
          <div className="h-0.5 rounded w-16 mt-1" style={{ background: accent }} />
          {[90, 80].map((w, i) => <div key={i} className="h-0.5 bg-gray-200 rounded" style={{ width: `${w}%` }} />)}
        </div>
      </div>
    </div>
  );
}

function CompactPreview({ accent }: { accent: string }) {
  return (
    <div className="h-full bg-white rounded-t p-1.5 flex flex-col gap-0.5">
      <div className="flex justify-between items-baseline border-b pb-0.5" style={{ borderColor: accent }}>
        <div className="h-1.5 rounded w-16" style={{ background: accent }} />
        <div className="h-0.5 bg-gray-400 rounded w-12" />
      </div>
      <div className="flex gap-1.5 flex-1">
        <div className="w-1/3 space-y-0.5">
          {[70, 90, 60, 80, 50, 70, 85].map((w, i) => <div key={i} className="h-0.5 bg-gray-200 rounded" style={{ width: `${w}%` }} />)}
        </div>
        <div className="flex-1 space-y-0.5">
          {[100, 80, 100, 70, 100, 80, 90].map((w, i) => <div key={i} className="h-0.5 bg-gray-200 rounded" style={{ width: `${w}%` }} />)}
        </div>
      </div>
    </div>
  );
}

// Extract the two colour stops from a theme gradient string for the previews.
function gradientStops(gradient: string): [string, string] {
  const hits = gradient.match(/#[0-9a-fA-F]{6}/g) ?? [];
  return [hits[0] ?? '#4f46e5', hits[1] ?? hits[0] ?? '#9333ea'];
}

function LayoutThumb({ layoutId, theme }: { layoutId: LayoutId; theme: Theme }) {
  const [from, to] = gradientStops(theme.gradient);
  switch (layoutId) {
    case 'modern':         return <ModernPreview from={from} to={to} />;
    case 'korean':         return <KoreanPreview accent={theme.accent} photo />;
    case 'korean-nophoto': return <KoreanPreview accent={theme.accent} photo={false} />;
    case 'classic':        return <ClassicPreview accent={theme.accent} />;
    case 'minimal':        return <MinimalPreview accent={theme.accent} />;
    case 'sidebar':        return <SidebarPreview sideColor={theme.gradient} />;
    case 'dark':           return <DarkPreview accent={theme.accent} />;
    case 'tech':           return <TechPreview accent={theme.accent} />;
    case 'academic':       return <AcademicPreview accent={theme.accent} />;
    case 'compact':        return <CompactPreview accent={theme.accent} />;
    default:               return <ModernPreview from={from} to={to} />;
  }
}

// ─── Two-step picker ──────────────────────────────────────────────────────────

interface TemplateSelectorProps {
  layoutId: LayoutId;
  themeId: ThemeId;
  onLayout: (id: LayoutId) => void;
  onTheme: (id: ThemeId) => void;
  onClose: () => void;
}

export function TemplateSelector({ layoutId, themeId, onLayout, onTheme, onClose }: TemplateSelectorProps) {
  const t = useTranslations('resume.templates');
  const tc = useTranslations('common');
  const theme = getTheme(themeId);
  useEscapeKey(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-selector-title"
        className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-slide-up"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 id="template-selector-title" className="text-lg font-semibold text-gray-900 dark:text-white">{t('title')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('layoutCount', { count: LAYOUTS.length })}</p>
          </div>
          <button onClick={onClose} aria-label={tc('close')} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Step 1 — Layout */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">{t('layoutHeading')}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => onLayout(layout.id)}
                  className={cn(
                    'text-left rounded-xl border-2 transition-all duration-150 overflow-hidden group relative',
                    layoutId === layout.id
                      ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
                  )}
                >
                  <div className="h-24 overflow-hidden bg-gray-50 dark:bg-gray-800">
                    <LayoutThumb layoutId={layout.id} theme={theme} />
                  </div>
                  {layoutId === layout.id && (
                    <div className="absolute top-1.5 right-1.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 drop-shadow-sm" fill="white" />
                    </div>
                  )}
                  <div className="p-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                    <p className="font-semibold text-gray-900 dark:text-white text-[11px] leading-tight">{t(`layout.${layout.id}.name`)}</p>
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight line-clamp-2">{t(`layout.${layout.id}.desc`)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — Colour */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">{t('colorHeading')}</h3>
            <div className="flex flex-wrap gap-3">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => onTheme(th.id)}
                  title={t(`color.${th.id}`)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 group',
                  )}
                >
                  <span
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      themeId === th.id ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-900' : 'ring-1 ring-black/5'
                    )}
                    style={{ background: th.gradient }}
                  >
                    {themeId === th.id && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{t(`color.${th.id}`)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('selectedLabel')}: <span className="font-medium text-indigo-600 dark:text-indigo-400">{t(`layout.${layoutId}.name`)} · {t(`color.${themeId}`)}</span>
          </p>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
            {t('apply')}
          </button>
        </div>
      </div>
    </div>
  );
}

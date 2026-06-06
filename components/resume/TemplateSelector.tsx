'use client';

import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResumeTemplate } from '@/types';

type TemplateInfo = {
  id: ResumeTemplate;
  name: string;
  desc: string;
  category: 'korean' | 'modern' | 'classic' | 'minimal' | 'creative';
  badge?: string;
  preview: React.ReactNode;
};

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

function KoreanPreview({ accent = '#1f2937' }: { accent?: string }) {
  return (
    <div className="h-full bg-white rounded-t flex flex-col p-2 gap-1">
      <div className="text-center h-2 rounded w-16 mx-auto" style={{ background: accent }} />
      <div className="flex gap-1.5 mt-1">
        <div className="w-6 h-9 rounded border-2 border-gray-200 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gray-200" />
        </div>
        <div className="flex-1 space-y-0.5">
          {[['bg-gray-100', 'bg-white'], ['bg-gray-100', 'bg-white'], ['bg-gray-100', 'bg-white']].map(([a, b], i) => (
            <div key={i} className="flex gap-0.5">
              <div className={`w-1/3 h-1.5 rounded border border-gray-200 ${a}`} />
              <div className={`flex-1 h-1.5 rounded border border-gray-200 ${b}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 border-t-2 border-gray-800">
        {[100, 80, 100].map((w, i) => (
          <div key={i} className="flex gap-0.5 mt-0.5">
            <div className="w-1/4 h-1 rounded bg-gray-100 border border-gray-200" />
            <div className="flex-1 h-1 rounded bg-white border border-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassicPreview({ accent = '#1f2937' }: { accent?: string }) {
  return (
    <div className="h-full bg-white rounded-t p-2 flex flex-col">
      <div className="text-center pb-1 border-b-2" style={{ borderColor: accent }}>
        <div className="h-2 rounded w-20 mx-auto mb-0.5" style={{ background: accent }} />
        <div className="h-1 rounded w-28 mx-auto bg-gray-200" />
      </div>
      <div className="mt-1.5 space-y-1.5 flex-1">
        {['EDUCATION', 'EXPERIENCE', 'SKILLS'].map((s) => (
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

function MinimalPreview({ accent = '#6b7280' }: { accent?: string }) {
  return (
    <div className="h-full bg-white rounded-t p-2 flex flex-col gap-1">
      <div className="h-3 rounded w-24" style={{ background: accent, opacity: 0.9 }} />
      <div className="h-1 bg-gray-200 rounded w-16" />
      <div className="flex gap-2 text-[8px] mt-0.5">
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

function DarkPreview() {
  return (
    <div className="h-full rounded-t flex flex-col" style={{ background: '#0f0f1a' }}>
      <div className="p-2 border-b border-indigo-500/30">
        <div className="h-2 rounded w-20" style={{ background: 'linear-gradient(90deg,#6366f1,#a855f7)' }} />
        <div className="h-0.5 bg-indigo-500/40 rounded w-16 mt-0.5" />
      </div>
      <div className="flex-1 p-2 space-y-1">
        {[100, 80, 100, 60, 90].map((w, i) => (
          <div key={i} className="h-0.5 rounded opacity-40" style={{ width: `${w}%`, background: i === 0 ? '#6366f1' : '#e2e8f0' }} />
        ))}
      </div>
    </div>
  );
}

function TechPreview() {
  return (
    <div className="h-full rounded-t flex flex-col" style={{ background: '#0d1117' }}>
      <div className="p-2">
        <div className="text-[6px] font-mono" style={{ color: '#58a6ff' }}>$ whoami</div>
        <div className="h-1.5 rounded w-16 mt-0.5" style={{ background: '#58a6ff', opacity: 0.8 }} />
        <div className="text-[5px] font-mono mt-0.5" style={{ color: '#7ee787' }}>→ dev · seoul</div>
      </div>
      <div className="flex-1 border-t border-gray-700/50 p-1.5 space-y-1">
        {[['#f0883e', 70], ['#58a6ff', 90], ['#7ee787', 60]].map(([c, w], i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full" style={{ background: c as string }} />
            <div className="h-0.5 rounded bg-gray-600" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AcademicPreview() {
  return (
    <div className="h-full bg-white rounded-t p-2 flex flex-col">
      <div className="border-b border-gray-400 pb-1">
        <div className="h-2 bg-gray-800 rounded w-24 mb-0.5" />
        <div className="h-0.5 bg-gray-400 rounded w-16" />
      </div>
      <div className="mt-1 flex gap-2 flex-1">
        <div className="flex-1 space-y-1">
          <div className="h-0.5 bg-gray-600 rounded w-12" />
          {[100, 80, 90].map((w, i) => <div key={i} className="h-0.5 bg-gray-200 rounded" style={{ width: `${w}%` }} />)}
          <div className="h-0.5 bg-gray-600 rounded w-16 mt-1" />
          {[90, 80].map((w, i) => <div key={i} className="h-0.5 bg-gray-200 rounded" style={{ width: `${w}%` }} />)}
        </div>
      </div>
    </div>
  );
}

function CompactPreview() {
  return (
    <div className="h-full bg-white rounded-t p-1.5 flex flex-col gap-0.5">
      <div className="flex justify-between items-baseline border-b border-gray-300 pb-0.5">
        <div className="h-1.5 bg-gray-800 rounded w-16" />
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

// ─── Template definitions ─────────────────────────────────────────────────────

const TEMPLATES: TemplateInfo[] = [
  // Modern Color Series
  { id: 'modern',   name: 'Modern Indigo',   desc: 'Indigo-purple gradient, 2-col sidebar layout',    category: 'modern',   badge: 'Popular', preview: <ModernPreview from="#4f46e5" to="#9333ea" /> },
  { id: 'navy',     name: 'Navy Blue',        desc: 'Deep navy professional, ideal for business roles', category: 'modern',   preview: <ModernPreview from="#1e3a8a" to="#2563eb" /> },
  { id: 'forest',   name: 'Forest Green',     desc: 'Rich green tones, great for environmental/bio',    category: 'modern',   preview: <ModernPreview from="#14532d" to="#16a34a" /> },
  { id: 'crimson',  name: 'Crimson Red',      desc: 'Bold red header, strong visual impact',            category: 'modern',   preview: <ModernPreview from="#7f1d1d" to="#dc2626" /> },
  { id: 'teal',     name: 'Teal Ocean',       desc: 'Refreshing teal, perfect for creative roles',      category: 'modern',   preview: <ModernPreview from="#134e4a" to="#0d9488" /> },
  { id: 'amber',    name: 'Amber Warm',       desc: 'Warm amber tones, friendly and approachable',      category: 'modern',   preview: <ModernPreview from="#78350f" to="#d97706" /> },
  { id: 'midnight', name: 'Midnight Dark',    desc: 'Dark mysterious header, sophisticated look',       category: 'modern',   preview: <ModernPreview from="#0f0c29" to="#302b63" /> },
  { id: 'rose',     name: 'Rose Pink',        desc: 'Elegant rose tones, modern and stylish',           category: 'modern',   preview: <ModernPreview from="#881337" to="#e11d48" /> },

  // Korean Official Series
  { id: 'korean',          name: '이력서 Standard',  desc: 'Official Korean résumé with photo slot',         category: 'korean', badge: 'KR Standard', preview: <KoreanPreview /> },
  { id: 'korean-blue',     name: '이력서 Blue',       desc: 'Korean form with indigo accents',                category: 'korean', preview: <KoreanPreview accent="#1d4ed8" /> },
  { id: 'korean-compact',  name: '이력서 Compact',    desc: 'No photo slot — more space for qualifications',  category: 'korean', preview: <KoreanPreview accent="#374151" /> },
  { id: 'korean-premium',  name: '이력서 Premium',    desc: 'Premium Korean layout with elegant borders',     category: 'korean', badge: 'Premium', preview: <KoreanPreview accent="#7c3aed" /> },

  // Classic Traditional Series
  { id: 'classic',   name: 'Classic Black',    desc: 'Timeless uppercase-section single-column layout',  category: 'classic', badge: 'Popular', preview: <ClassicPreview /> },
  { id: 'oxford',    name: 'Oxford Formal',    desc: 'Very formal serif-inspired style with double rule', category: 'classic', preview: <ClassicPreview accent="#1e3a8a" /> },
  { id: 'corporate', name: 'Corporate Blue',   desc: 'Corporate navy/blue, trusted by finance roles',    category: 'classic', preview: <ClassicPreview accent="#1d4ed8" /> },
  { id: 'executive', name: 'Executive Gold',   desc: 'Premium navy with gold accents for leadership',    category: 'classic', badge: 'Premium', preview: <ClassicPreview accent="#92400e" /> },

  // Minimal Clean Series
  { id: 'minimal', name: 'Ultra Minimal',   desc: 'Maximum whitespace, typography-first design',      category: 'minimal', preview: <MinimalPreview accent="#374151" /> },
  { id: 'nordic',  name: 'Nordic Clean',    desc: 'Scandinavian style with soft gray accents',        category: 'minimal', preview: <MinimalPreview accent="#94a3b8" /> },
  { id: 'slate',   name: 'Slate Modern',    desc: 'Slate gray palette with subtle left border',       category: 'minimal', preview: <MinimalPreview accent="#475569" /> },
  { id: 'tokyo',   name: 'Tokyo Minimal',   desc: 'Japanese-inspired clean hierarchy with dot marks', category: 'minimal', preview: <MinimalPreview accent="#0ea5e9" /> },

  // Creative / Special
  { id: 'sidebar',  name: 'Full Sidebar',   desc: 'Colored sidebar with photo, two-tone layout',      category: 'creative', preview: <SidebarPreview sideColor="linear-gradient(180deg,#4f46e5,#7c3aed)" /> },
  { id: 'dark',     name: 'Dark Mode',      desc: 'Dark background with glowing accents (digital)',   category: 'creative', preview: <DarkPreview /> },
  { id: 'tech',     name: 'Developer CV',   desc: 'Terminal-inspired design for engineers',           category: 'creative', badge: 'Dev', preview: <TechPreview /> },
  { id: 'academic', name: 'Academic CV',    desc: 'Academic format, publications section prominent',  category: 'creative', preview: <AcademicPreview /> },
  { id: 'compact',  name: 'Compact Dense',  desc: 'Maximum information on one page, tight spacing',  category: 'creative', preview: <CompactPreview /> },
];

const CATEGORIES = [
  { id: 'all',      label: 'All (25)' },
  { id: 'modern',   label: '🎨 Modern (8)' },
  { id: 'korean',   label: '🇰🇷 Korean (4)' },
  { id: 'classic',  label: '📋 Classic (4)' },
  { id: 'minimal',  label: '⬜ Minimal (4)' },
  { id: 'creative', label: '✨ Creative (5)' },
] as const;

interface TemplateSelectorProps {
  selected: ResumeTemplate;
  onSelect: (template: ResumeTemplate) => void;
  onClose: () => void;
}

export function TemplateSelector({ selected, onSelect, onClose }: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'modern' | 'korean' | 'classic' | 'minimal' | 'creative'>('all');

  const filtered = activeCategory === 'all' ? TEMPLATES : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden animate-slide-up" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Choose a Template</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">25 professional templates — pick the one that fits your target role</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-gray-100 dark:border-gray-800 overflow-x-auto scrollbar-hide flex-shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template.id)}
                className={cn(
                  'text-left rounded-xl border-2 transition-all duration-150 overflow-hidden group relative',
                  selected === template.id
                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
                )}
              >
                {/* Preview */}
                <div className="h-24 overflow-hidden bg-gray-50 dark:bg-gray-800">
                  {template.preview}
                </div>

                {/* Selected indicator */}
                {selected === template.id && (
                  <div className="absolute top-1.5 right-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 drop-shadow-sm" fill="white" />
                  </div>
                )}

                {/* Badge */}
                {template.badge && (
                  <div className="absolute top-1.5 left-1.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-600 text-white leading-none">
                      {template.badge}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="p-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                  <p className="font-semibold text-gray-900 dark:text-white text-[11px] leading-tight">{template.name}</p>
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight line-clamp-2">{template.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {filtered.length} template{filtered.length !== 1 ? 's' : ''} shown · Selected: <span className="font-medium text-indigo-600 dark:text-indigo-400">{TEMPLATES.find((t) => t.id === selected)?.name}</span>
          </p>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

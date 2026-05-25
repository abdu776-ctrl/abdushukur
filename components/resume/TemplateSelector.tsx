'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResumeTemplate } from '@/types';

const templates: { id: ResumeTemplate; name: string; desc: string; preview: string }[] = [
  {
    id: 'modern',
    name: 'Modern',
    desc: 'Clean sidebar layout with gradient header. Perfect for tech roles.',
    preview: 'bg-gradient-to-br from-indigo-500 to-purple-600',
  },
  {
    id: 'classic',
    name: 'Classic',
    desc: 'Traditional chronological format. Trusted by all industries.',
    preview: 'bg-gradient-to-br from-gray-700 to-gray-900',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Ultra-clean typographic layout. Stands out with simplicity.',
    preview: 'bg-gradient-to-br from-slate-400 to-slate-600',
  },
  {
    id: 'korean',
    name: '이력서 (Korean)',
    desc: 'Standard Korean format with photo slot and formal table layout.',
    preview: 'bg-gradient-to-br from-red-500 to-rose-700',
  },
];

interface TemplateSelectorProps {
  selected: ResumeTemplate;
  onSelect: (template: ResumeTemplate) => void;
  onClose: () => void;
}

export function TemplateSelector({ selected, onSelect, onClose }: TemplateSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Choose a Template</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Select the style that best fits your target role</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={cn(
                'text-left rounded-xl border-2 transition-all duration-150 overflow-hidden',
                selected === template.id
                  ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              {/* Preview */}
              <div className={`h-28 ${template.preview} relative flex items-center justify-center`}>
                <div className="w-16 h-20 bg-white/20 backdrop-blur-sm rounded-sm flex flex-col gap-1 p-2">
                  <div className="h-1.5 bg-white/60 rounded-full w-full" />
                  <div className="h-1 bg-white/40 rounded-full w-3/4" />
                  <div className="mt-1 space-y-0.5">
                    <div className="h-0.5 bg-white/30 rounded-full" />
                    <div className="h-0.5 bg-white/30 rounded-full w-5/6" />
                    <div className="h-0.5 bg-white/30 rounded-full w-4/6" />
                  </div>
                </div>
                {selected === template.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-600" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-3 bg-white dark:bg-gray-900">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{template.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{template.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

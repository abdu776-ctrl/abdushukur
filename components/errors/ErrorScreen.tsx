'use client';

import Link from 'next/link';
import { Sparkles, ArrowLeft, RotateCw } from 'lucide-react';

/**
 * Shared full-page screen for 404 and unexpected errors.
 *
 * These pages sit above the locale layout, so `useTranslations` is not
 * available: the strings are passed in by the route, which reads them from the
 * locale in the URL. Without this, Next's own English default page was shown
 * for every language.
 */
export function ErrorScreen({
  title,
  body,
  homeHref,
  homeLabel,
  onRetry,
  retryLabel,
  code,
}: {
  title: string;
  body: string;
  homeHref: string;
  homeLabel: string;
  onRetry?: () => void;
  retryLabel?: string;
  code?: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f11] flex flex-col items-center justify-center px-6 text-center">
      <Link href={homeHref} className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="font-bold text-lg text-gray-900 dark:text-white">Koreer</span>
      </Link>

      {code && (
        <p className="text-6xl font-bold text-gray-200 dark:text-gray-800 mb-4 select-none">{code}</p>
      )}

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">{body}</p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        {onRetry && retryLabel && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            {retryLabel}
          </button>
        )}
        <Link
          href={homeHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}

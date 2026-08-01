'use client';

import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastData = { type: 'success' | 'error'; message: string };

/**
 * Lightweight, self-dismissing status message. Replaces native alert() so
 * feedback is consistent, non-blocking, and screen-reader friendly.
 */
export function Toast({
  toast,
  onClose,
  closeLabel = 'Close',
}: {
  toast: ToastData | null;
  onClose: () => void;
  closeLabel?: string;
}) {
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(onClose, 6000);
    return () => clearTimeout(id);
  }, [toast, onClose]);

  if (!toast) return null;
  const isError = toast.type === 'error';

  return (
    <div
      role="status"
      aria-live={isError ? 'assertive' : 'polite'}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md animate-slide-up"
    >
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg',
          isError
            ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300'
            : 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300'
        )}
      >
        {isError
          ? <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          : <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />}
        <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="flex-shrink-0 -mr-1 -mt-0.5 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

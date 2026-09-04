'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { listDocuments, deleteDocument, type SavedDocument } from '@/lib/documents';
import { useAuth } from '@/lib/useAuth';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Toast, type ToastData } from '@/components/ui/Toast';
import {
  FileText,
  PenLine,
  Plus,
  Trash2,
  ChevronRight,
  LogIn,
  Clock,
} from 'lucide-react';

/** Where a saved document reopens. The builder reads `?doc=` and rehydrates. */
export function documentHref(locale: string, doc: { id: string; kind: string }) {
  const path = doc.kind === 'resume' ? 'resume' : 'cover-letter';
  return `/${locale}/${path}?doc=${doc.id}`;
}

function formatWhen(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
      .format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

export function DocumentsList({ locale }: { locale: string }) {
  const t = useTranslations('documents');
  const tc = useTranslations('common');
  const { status } = useAuth();
  const isSignedIn = status === 'authenticated';

  const [docs, setDocs] = useState<SavedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!isSignedIn) {
      setDocs([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    listDocuments()
      .then((rows) => {
        if (active) setDocs(rows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status, isSignedIn]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      setToast({ type: 'success', message: t('deleted') });
    } catch (err) {
      console.error('delete document failed:', err);
      setToast({ type: 'error', message: t('deleteError') });
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-5">
          {t('signInToView')}
        </p>
        <Link
          href={`/${locale}/auth/login`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          {t('signIn')}
        </Link>
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('empty')}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5 max-w-sm">{t('emptyHint')}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/${locale}/resume`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('newResume')}
          </Link>
          <Link
            href={`/${locale}/cover-letter`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('newCoverLetter')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {docs.map((doc) => {
          const isResume = doc.kind === 'resume';
          const confirming = confirmId === doc.id;
          return (
            <li
              key={doc.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3 p-4">
                <Link
                  href={documentHref(locale, doc)}
                  className="flex items-center gap-4 flex-1 min-w-0 group rounded-xl"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isResume ? 'bg-blue-50 dark:bg-blue-500/10' : 'bg-purple-50 dark:bg-purple-500/10'
                    }`}
                  >
                    {isResume ? (
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <PenLine className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {doc.title || t('untitled')}
                      </p>
                      <Badge variant={isResume ? 'info' : 'purple'} size="sm">
                        {isResume ? t('kindResume') : t('kindCoverLetter')}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {doc.company ? `${doc.company} · ` : ''}
                      {formatWhen(doc.updated_at, locale)}
                    </p>
                  </div>
                  <span className="hidden sm:inline text-xs font-medium text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    {t('open')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </Link>

                {!confirming && (
                  <button
                    type="button"
                    onClick={() => setConfirmId(doc.id)}
                    aria-label={t('delete')}
                    title={t('delete')}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Inline confirmation — no blocking native dialog. */}
              {confirming && (
                <div className="flex flex-wrap items-center justify-end gap-2 px-4 pb-4 -mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mr-auto">
                    {t('confirmDelete')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {tc('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                  >
                    {t('delete')}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Toast toast={toast} onClose={() => setToast(null)} closeLabel={tc('close')} />
    </>
  );
}

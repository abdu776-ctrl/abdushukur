'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Toast, type ToastData } from '@/components/ui/Toast';
import { Shield, AlertTriangle, Lock, Download, ChevronRight } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuth, signOutEverywhere } from '@/lib/useAuth';
import { listDocuments } from '@/lib/documents';
import { loadProfile } from '@/lib/profile';
import { loadNarrative } from '@/lib/whyKorea';

/**
 * Account management: change password, download everything, delete the account.
 *
 * Deletion goes through the `delete_current_user` database function, which can
 * only ever delete the caller's own row and cascades to their documents and
 * profile. No admin key is involved, so nothing privileged ships anywhere.
 */
export function AccountPanel({ locale }: { locale: string }) {
  const t = useTranslations('settings.account');
  const tc = useTranslations('common');
  const ta = useTranslations('auth');
  const { user, status } = useAuth();

  const [toast, setToast] = useState<ToastData | null>(null);
  const [openPanel, setOpenPanel] = useState<'password' | 'export' | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [exporting, setExporting] = useState(false);

  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setToast({ type: 'error', message: ta('register.passwordMismatch') });
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setToast({ type: 'error', message: error.message });
        return;
      }
      setPassword('');
      setConfirmPassword('');
      setOpenPanel(null);
      setToast({ type: 'success', message: t('passwordUpdated') });
    } catch (err) {
      console.error('password change failed:', err);
      setToast({ type: 'error', message: ta('genericError') });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const documents = await listDocuments();
      const profile = loadProfile();
      const narrative = loadNarrative();
      if (documents.length === 0 && !profile && !narrative) {
        setToast({ type: 'error', message: t('exportEmpty') });
        return;
      }

      const payload = {
        exportedAt: new Date().toISOString(),
        account: { email: user?.email ?? null, name: user?.name ?? null },
        careerProfile: profile,
        whyKorea: narrative,
        documents,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `koreer-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('data export failed:', err);
      setToast({ type: 'error', message: t('exportError') });
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    const supabase = getSupabase();
    if (!supabase) return;

    setDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_current_user');
      if (error) {
        console.error('account deletion failed:', error.message);
        setToast({ type: 'error', message: t('deleteError') });
        return;
      }
      // The account is gone; drop the local session and any cached copies.
      try {
        localStorage.removeItem('koreer:career-profile');
        localStorage.removeItem('koreer:why-korea');
      } catch {
        /* storage unavailable */
      }
      await signOutEverywhere(`/${locale}`);
    } catch (err) {
      console.error('account deletion failed:', err);
      setToast({ type: 'error', message: t('deleteError') });
    } finally {
      setDeleting(false);
    }
  }

  if (status !== 'authenticated' || !user) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 animate-fade-in">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-indigo-500" />
          {t('title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('signInRequired')}</p>
      </div>
    );
  }

  const canDelete = confirmEmail.trim().toLowerCase() === (user.email ?? '').toLowerCase();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-indigo-500" />
          {t('title')}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {t('signedInAs')} <span className="font-medium">{user.email}</span>
        </p>

        <div className="space-y-2">
          {/* Change password */}
          <button
            type="button"
            onClick={() => setOpenPanel(openPanel === 'password' ? null : 'password')}
            aria-expanded={openPanel === 'password'}
            className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t('changePassword')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('changePasswordDesc')}</p>
              </div>
            </div>
            <ChevronRight
              className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                openPanel === 'password' ? 'rotate-90' : ''
              }`}
            />
          </button>

          {openPanel === 'password' && (
            <form onSubmit={handleChangePassword} className="px-3 pb-3 space-y-3">
              <Input
                type="password"
                label={t('newPassword')}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                hint={ta('register.passwordHint')}
              />
              <Input
                type="password"
                label={t('confirmPassword')}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setOpenPanel(null)}>
                  {tc('cancel')}
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={savingPassword}>
                  {tc('save')}
                </Button>
              </div>
            </form>
          )}

          {/* Export */}
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left disabled:opacity-60"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t('exportData')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('exportDataDesc')}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-200 dark:border-red-500/20 p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-700 dark:text-red-400">{t('deleteAccount')}</h3>
            <p className="text-sm text-red-600 dark:text-red-500 mt-1 leading-relaxed">
              {t('deleteWarning')} {t('deleteDetail')}
            </p>
          </div>
        </div>

        {!deleteOpen ? (
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            {t('deleteAccount')}
          </Button>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm text-red-700 dark:text-red-400">
              {t('deleteConfirmHint')}{' '}
              <span className="font-medium">{user.email}</span>
            </label>
            <Input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={user.email ?? ''}
              autoComplete="off"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDeleteOpen(false);
                  setConfirmEmail('');
                }}
              >
                {tc('cancel')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!canDelete}
                loading={deleting}
                onClick={handleDelete}
              >
                {deleting ? t('deleting') : t('deleteAccount')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} closeLabel={tc('close')} />
    </div>
  );
}

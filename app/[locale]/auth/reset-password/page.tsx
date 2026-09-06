'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Sparkles, Lock, ArrowLeft } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

/**
 * Landing page for the emailed reset link. Supabase turns the link's hash into
 * a short-lived recovery session, so the user can set a new password here
 * without ever typing the old one.
 */
export default function ResetPasswordPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>('checking');

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setReady('invalid');
      return;
    }
    // An expired or reused link comes back as an error in the URL hash.
    if (window.location.hash.includes('error')) {
      setReady('invalid');
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(data.session ? 'ok' : 'invalid');
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError(t('auth.register.passwordMismatch'));
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setError(t('auth.notConfigured'));
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setDone(true);
      setTimeout(() => {
        window.location.href = `/${locale}/dashboard`;
      }, 1500);
    } catch (err) {
      console.error('password update failed:', err);
      setError(t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f11] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">Koreer</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('auth.reset.title')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('auth.reset.subtitle')}
              </p>
            </div>

            {ready === 'invalid' ? (
              <div className="space-y-4 text-center">
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {t('auth.reset.invalidLink')}
                </p>
                <Link
                  href={`/${locale}/auth/forgot-password`}
                  className="inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {t('auth.forgot.submit')}
                </Link>
              </div>
            ) : done ? (
              <p role="status" className="text-sm text-green-600 dark:text-green-400 text-center">
                {t('auth.reset.success')}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
                <Input
                  type="password"
                  label={t('auth.reset.newPassword')}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  hint={t('auth.register.passwordHint')}
                />
                <Input
                  type="password"
                  label={t('auth.reset.confirmPassword')}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                  autoComplete="new-password"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading || ready === 'checking'}
                  className="w-full"
                >
                  {t('auth.reset.submit')}
                </Button>
              </form>
            )}

            <p className="text-center mt-6">
              <Link
                href={`/${locale}/auth/login`}
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t('auth.forgot.back')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

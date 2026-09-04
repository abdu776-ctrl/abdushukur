'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Sparkles, Mail, Lock, Github, Chrome } from 'lucide-react';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { getSupabase } from '@/lib/supabase';

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  // Supabase reports a bad or expired confirmation link in the URL hash.
  // Surface it here instead of leaving the user on a blank page.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('error')) {
      setError(t('auth.linkExpired'));
      setNeedsConfirmation(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [t]);

  async function handleResendConfirmation() {
    const supabase = getSupabase();
    if (!supabase || !email) return;
    setResending(true);
    setError('');
    setNotice('');
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/${locale}/dashboard` },
      });
      if (resendError) setError(resendError.message);
      else setNotice(t('auth.resendSent'));
    } catch (err) {
      console.error('resend failed:', err);
      setError(t('auth.genericError'));
    } finally {
      setResending(false);
    }
  }

  function handleGoogleLogin() {
    signIn('google', { callbackUrl: `/${locale}/dashboard` });
  }

  // Real email/password sign-in through Supabase.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const supabase = getSupabase();
    if (!supabase) {
      setError(t('auth.notConfigured'));
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        const unconfirmed = /not confirmed|confirm your email/i.test(signInError.message);
        setNeedsConfirmation(unconfirmed);
        setError(unconfirmed ? t('auth.notConfirmed') : signInError.message);
        return;
      }
      window.location.href = `/${locale}/dashboard`;
    } catch (err) {
      console.error('sign in failed:', err);
      setError(t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f11] flex flex-col">
      {/* Top bar */}
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

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('auth.login.title')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('auth.login.subtitle')}
              </p>
            </div>

            {/* Social login */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150"
              >
                <Chrome className="w-4 h-4 text-blue-500" />
                Continue with Google
              </button>
              <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150">
                <Github className="w-4 h-4" />
                Continue with GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                {t('auth.login.continueWith')}
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              {notice && (
                <p role="status" className="text-sm text-green-600 dark:text-green-400">{notice}</p>
              )}
              {needsConfirmation && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={!email || resending}
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 underline underline-offset-2 disabled:opacity-50"
                >
                  {t('auth.resend')}
                </button>
              )}
              <Input
                type="email"
                label={t('auth.login.email')}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
                autoComplete="email"
              />
              <div>
                <Input
                  type="password"
                  label={t('auth.login.password')}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                  autoComplete="current-password"
                />
                <div className="text-right mt-1.5">
                  <Link
                    href="#"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {t('auth.login.forgotPassword')}
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                {t('auth.login.submit')}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              {t('auth.login.noAccount')}{' '}
              <Link
                href={`/${locale}/auth/register`}
                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                {t('auth.login.signUp')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Sparkles, Mail, Lock, User, Globe, Chrome, Github } from 'lucide-react';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { getSupabase } from '@/lib/supabase';

const nationalities = [
  { value: 'uzbekistan', flag: '🇺🇿', label: 'Uzbekistan' },
  { value: 'kazakhstan', flag: '🇰🇿', label: 'Kazakhstan' },
  { value: 'kyrgyzstan', flag: '🇰🇬', label: 'Kyrgyzstan' },
  { value: 'mongolia', flag: '🇲🇳', label: 'Mongolia' },
  { value: 'vietnam', flag: '🇻🇳', label: 'Vietnam' },
  { value: 'other', flag: '🌍', label: 'Other' },
];

export default function RegisterPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [nationality, setNationality] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function handleGoogleLogin() {
    signIn('google', { callbackUrl: `/${locale}/dashboard` });
  }

  // Real email/password registration through Supabase. Password auth also works
  // inside the Android WebView, where Google blocks its OAuth flow.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setError('');
    setNotice('');

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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, nationality },
          emailRedirectTo: `${window.location.origin}/${locale}/dashboard`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // With email confirmation enabled Supabase returns no session yet.
      if (data.session) {
        window.location.href = `/${locale}/dashboard`;
      } else {
        setNotice(t('auth.register.checkEmail'));
      }
    } catch (err) {
      console.error('sign up failed:', err);
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
      <div className="flex-1 flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('auth.register.title')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('auth.register.subtitle')}
              </p>
            </div>

            {/* Social */}
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
                {t('common.or')}
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                label={t('auth.register.fullName')}
                placeholder="Abdushukur Yusupov"
                leftIcon={<User className="w-4 h-4" />}
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                type="email"
                label={t('auth.register.email')}
                placeholder="you@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                label={t('auth.register.password')}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                required
                minLength={8}
                autoComplete="new-password"
                hint={t('auth.register.passwordHint')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                type="password"
                label={t('auth.register.confirmPassword')}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />

              {error && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              {notice && (
                <p role="status" className="text-sm text-green-600 dark:text-green-400">{notice}</p>
              )}

              {/* Nationality Select */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('auth.register.nationality')}
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-150 appearance-none"
                    required
                  >
                    <option value="" disabled>Select your country...</option>
                    {nationalities.map((n) => (
                      <option key={n.value} value={n.value}>
                        {n.flag} {n.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group mt-2">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-colors flex items-center justify-center">
                    {agreed && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('auth.register.agreeTerms')}
                </span>
              </label>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={!agreed}
                className="w-full"
              >
                {t('auth.register.submit')}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              {t('auth.register.hasAccount')}{' '}
              <Link
                href={`/${locale}/auth/login`}
                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                {t('auth.register.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

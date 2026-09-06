'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Sparkles, Mail, ArrowLeft } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      // Deliberately the same message whether or not the address is registered,
      // so this page cannot be used to discover who has an account.
      setSent(true);
    } catch (err) {
      console.error('password reset request failed:', err);
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
                <Mail className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('auth.forgot.title')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('auth.forgot.subtitle')}
              </p>
            </div>

            {sent ? (
              <p role="status" className="text-sm text-green-600 dark:text-green-400 text-center">
                {t('auth.forgot.sent')}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
                <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
                  {t('auth.forgot.submit')}
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

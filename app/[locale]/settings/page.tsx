'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WhyKoreaBuilder } from '@/components/why-korea/WhyKoreaBuilder';
import { CareerProfileForm } from '@/components/profile/CareerProfileForm';
import { AccountPanel } from '@/components/settings/AccountPanel';
import { ProfilePanel } from '@/components/settings/ProfilePanel';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { locales, localeNames } from '@/lib/i18n';
import { FlagBadge } from '@/components/ui/FlagBadge';
import { useState, useEffect } from 'react';
import {
  User,
  Palette,
  Globe,
  Shield,
  Sun,
  Moon,
  Monitor,
  MapPin,
  Briefcase,
} from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type SettingsTab = 'profile' | 'career' | 'whyKorea' | 'appearance' | 'language' | 'account';

const TAB_IDS: SettingsTab[] = ['profile', 'career', 'whyKorea', 'appearance', 'language', 'account'];

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  useEffect(() => setMounted(true), []);

  // The buttons in the Language tab used to be decoration — they had no click
  // handler at all. Switching keeps the query string, so a document open in a
  // builder survives the change.
  function switchLocale(next: Locale) {
    if (next === locale) return;
    const segments = window.location.pathname.split('/');
    segments[1] = next;
    router.push(segments.join('/') + window.location.search);
  }

  // Allow deep-linking to a tab, e.g. /settings?tab=whyKorea from the editor.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested && (TAB_IDS as string[]).includes(requested)) {
      setActiveTab(requested as SettingsTab);
    }
  }, []);

  const tabs = [
    { id: 'profile' as SettingsTab, icon: <User className="w-4 h-4" />, label: t('settings.profile.title') },
    { id: 'career' as SettingsTab, icon: <Briefcase className="w-4 h-4" />, label: t('settings.career.title') },
    { id: 'whyKorea' as SettingsTab, icon: <MapPin className="w-4 h-4" />, label: t('settings.whyKorea.title') },
    { id: 'appearance' as SettingsTab, icon: <Palette className="w-4 h-4" />, label: t('settings.appearance.title') },
    { id: 'language' as SettingsTab, icon: <Globe className="w-4 h-4" />, label: t('settings.language.title') },
    { id: 'account' as SettingsTab, icon: <Shield className="w-4 h-4" />, label: t('settings.account.title') },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('settings.title')}
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-56 flex-shrink-0">
            <nav className="space-y-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left',
                    activeTab === tab.id
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Profile */}
            {activeTab === 'profile' && <ProfilePanel />}

            {/* Career profile */}
            {activeTab === 'career' && <CareerProfileForm />}

            {/* Why Korea */}
            {activeTab === 'whyKorea' && <WhyKoreaBuilder />}

            {/* Appearance */}
            {activeTab === 'appearance' && mounted && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6 animate-fade-in">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  {t('settings.appearance.title')}
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('settings.appearance.theme')}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', icon: <Sun className="w-5 h-5" />, label: t('settings.appearance.light') },
                      { value: 'dark', icon: <Moon className="w-5 h-5" />, label: t('settings.appearance.dark') },
                      { value: 'system', icon: <Monitor className="w-5 h-5" />, label: t('settings.appearance.system') },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150',
                          theme === option.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                      >
                        {option.icon}
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('common.preview')}</label>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="h-8 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 px-3">
                      {['bg-red-400', 'bg-yellow-400', 'bg-green-400'].map((c) => (
                        <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                      ))}
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-[#0f0f11] flex gap-3">
                      <div className="w-20 bg-white dark:bg-gray-900 rounded-lg h-16 border border-gray-200 dark:border-gray-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-indigo-500 rounded w-1/3" />
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Language */}
            {activeTab === 'language' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6 animate-fade-in">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  {t('settings.language.title')}
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('settings.language.appLanguage')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {locales.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => switchLocale(loc)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-150',
                          loc === locale
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                      >
                        <FlagBadge code={loc} className="w-8 h-6 text-[11px]" />
                        <div className="text-left">
                          <p className={cn(
                            'text-sm font-medium',
                            loc === locale
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-gray-900 dark:text-white'
                          )}>
                            {localeNames[loc]}
                          </p>
                        </div>
                        {loc === locale && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Account */}
            {activeTab === 'account' && <AccountPanel locale={locale} />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


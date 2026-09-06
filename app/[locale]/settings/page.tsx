'use client';

import { useTranslations, useLocale } from 'next-intl';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { WhyKoreaBuilder } from '@/components/why-korea/WhyKoreaBuilder';
import { CareerProfileForm } from '@/components/profile/CareerProfileForm';
import { AccountPanel } from '@/components/settings/AccountPanel';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { locales, localeNames, localeFlags } from '@/lib/i18n';
import { useState, useEffect } from 'react';
import {
  User,
  Palette,
  Globe,
  Bell,
  Shield,
  Sun,
  Moon,
  Monitor,
  Save,
  Camera,
  MapPin,
  Briefcase,
} from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type SettingsTab = 'profile' | 'career' | 'whyKorea' | 'appearance' | 'language' | 'notifications' | 'account';

const TAB_IDS: SettingsTab[] = ['profile', 'career', 'whyKorea', 'appearance', 'language', 'notifications', 'account'];

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saving, setSaving] = useState(false);

  useEffect(() => setMounted(true), []);

  // Allow deep-linking to a tab, e.g. /settings?tab=whyKorea from the editor.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested && (TAB_IDS as string[]).includes(requested)) {
      setActiveTab(requested as SettingsTab);
    }
  }, []);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
  }

  const tabs = [
    { id: 'profile' as SettingsTab, icon: <User className="w-4 h-4" />, label: t('settings.profile.title') },
    { id: 'career' as SettingsTab, icon: <Briefcase className="w-4 h-4" />, label: t('settings.career.title') },
    { id: 'whyKorea' as SettingsTab, icon: <MapPin className="w-4 h-4" />, label: t('settings.whyKorea.title') },
    { id: 'appearance' as SettingsTab, icon: <Palette className="w-4 h-4" />, label: t('settings.appearance.title') },
    { id: 'language' as SettingsTab, icon: <Globe className="w-4 h-4" />, label: t('settings.language.title') },
    { id: 'notifications' as SettingsTab, icon: <Bell className="w-4 h-4" />, label: t('settings.notifications.title') },
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
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6 animate-fade-in">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  {t('settings.profile.title')}
                </h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      A
                    </div>
                    <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Camera className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Abdushukur Yusupov</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">abdu776@hanyang.ac.kr</p>
                    <Badge variant="success" size="sm" className="mt-1">🇺🇿 Uzbekistan</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('settings.profile.name')}
                    defaultValue="Abdushukur Yusupov"
                  />
                  <Input
                    label={t('settings.profile.email')}
                    type="email"
                    defaultValue="abdu776@hanyang.ac.kr"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('settings.profile.nationality')}
                    </label>
                    <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="uzbekistan">🇺🇿 Uzbekistan</option>
                      <option value="kazakhstan">🇰🇿 Kazakhstan</option>
                      <option value="kyrgyzstan">🇰🇬 Kyrgyzstan</option>
                      <option value="mongolia">🇲🇳 Mongolia</option>
                      <option value="vietnam">🇻🇳 Vietnam</option>
                    </select>
                  </div>
                </div>

                <Textarea
                  label={t('settings.profile.bio')}
                  placeholder="Tell us about yourself and your career goals in Korea..."
                  rows={3}
                />

                <div className="flex justify-end">
                  <Button variant="primary" size="md" icon={<Save className="w-4 h-4" />} loading={saving} onClick={handleSave}>
                    {t('settings.profile.saveChanges')}
                  </Button>
                </div>
              </div>
            )}

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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preview</label>
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
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-150',
                          loc === locale
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                      >
                        <span className="text-2xl">{localeFlags[loc]}</span>
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

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 animate-fade-in">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-500" />
                  {t('settings.notifications.title')}
                </h2>
                {[
                  { label: t('settings.notifications.email'), desc: t('settings.notifications.emailDesc'), defaultOn: true },
                  { label: t('settings.notifications.tips'), desc: t('settings.notifications.tipsDesc'), defaultOn: true },
                  { label: t('settings.notifications.templates'), desc: t('settings.notifications.templatesDesc'), defaultOn: false },
                ].map((item) => (
                  <ToggleRow key={item.label} {...item} />
                ))}
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

function ToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [enabled, setEnabled] = useState(defaultOn);

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0',
          enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
        )}
      >
        <div className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          enabled ? 'translate-x-5' : 'translate-x-0'
        )} />
      </button>
    </div>
  );
}

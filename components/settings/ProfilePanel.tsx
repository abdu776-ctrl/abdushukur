'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toast, type ToastData } from '@/components/ui/Toast';
import { User, Save } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { authErrorMessage } from '@/lib/authErrors';

// Value is the stored code; the label comes from the locale files.
const COUNTRIES = [
  { value: 'uzbekistan', flag: '🇺🇿' },
  { value: 'kazakhstan', flag: '🇰🇿' },
  { value: 'kyrgyzstan', flag: '🇰🇬' },
  { value: 'mongolia', flag: '🇲🇳' },
  { value: 'china', flag: '🇨🇳' },
  { value: 'vietnam', flag: '🇻🇳' },
  { value: 'other', flag: '🌍' },
];

/**
 * Account profile: the name, country and bio kept on the Supabase user.
 *
 * This used to be a static mock showing one hardcoded person to everyone, with
 * a save button that only waited a second. It now reads and writes the real
 * signed-in user.
 */
export function ProfilePanel() {
  const t = useTranslations('settings.profile');
  const te = useTranslations('authErrors');
  const tr = useTranslations('auth.register');
  const tc = useTranslations('common');
  const { user, status } = useAuth();

  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  // Seed the form from the signed-in user once the session resolves.
  useEffect(() => {
    if (status !== 'authenticated' || !user) return;
    let active = true;
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
      setName((meta.full_name as string) || user.name || '');
      setNationality((meta.nationality as string) || '');
      setBio((meta.bio as string) || '');
    });
    return () => {
      active = false;
    };
  }, [status, user]);

  async function handleSave() {
    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name, nationality, bio },
      });
      if (error) {
        setToast({ type: 'error', message: authErrorMessage(error, te) });
        return;
      }
      setToast({ type: 'success', message: t('saved') });
    } catch (err) {
      console.error('profile save failed:', err);
      setToast({ type: 'error', message: t('saveError') });
    } finally {
      setSaving(false);
    }
  }

  const heading = (
    <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <User className="w-4 h-4 text-indigo-500" />
      {t('title')}
    </h2>
  );

  if (status !== 'authenticated' || !user) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-2 animate-fade-in">
        {heading}
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('signInRequired')}</p>
      </div>
    );
  }

  const initial = (name || user.email || '?').trim().charAt(0).toUpperCase();
  const country = COUNTRIES.find((c) => c.value === nationality);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6 animate-fade-in">
      {heading}

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={name || user.email || ''} className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">{name || '—'}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          {country && (
            <Badge variant="success" size="sm" className="mt-1">
              {country.flag} {tr(`countries.${country.value}`)}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t('name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
        <Input
          label={t('email')}
          type="email"
          value={user.email ?? ''}
          readOnly
          disabled
          hint={t('emailFixed')}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {t('nationality')}
          </label>
          <select
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{tr('selectCountry')}</option>
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.flag} {tr(`countries.${c.value}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Textarea
        label={t('bio')}
        placeholder={t('bioPlaceholder')}
        rows={3}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="md"
          icon={<Save className="w-4 h-4" />}
          loading={saving}
          onClick={handleSave}
        >
          {t('saveChanges')}
        </Button>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} closeLabel={tc('close')} />
    </div>
  );
}

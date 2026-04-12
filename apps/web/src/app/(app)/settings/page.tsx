'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Button } from '@smartboard/ui';
import { ThemePicker } from '../../../components/settings/theme-picker';
import { useUser, useUpdatePreferences } from '../../../hooks/useUser';
import type { UserPreferences } from '../../../lib/auth';
import { LANGUAGE_OPTIONS, normalizeLocale, type SupportedLocale } from '../../../i18n/config';
import { useLocale } from '../../../i18n/use-t';

export default function SettingsPage() {
  const { data: user } = useUser();
  const updatePrefs = useUpdatePreferences();
  const { t, setLocale, locale } = useLocale();

  const stored = user?.preferences as Partial<UserPreferences> | undefined;

  const [themeScheme, setThemeScheme] = useState<{
    theme: UserPreferences['theme'];
    scheme: UserPreferences['scheme'];
  }>({ theme: stored?.theme ?? 'light', scheme: stored?.scheme ?? 'mint' });

  const [language, setLanguage] = useState<SupportedLocale>(
    normalizeLocale(stored?.language ?? locale),
  );
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Sync local state when user loads
  useEffect(() => {
    if (stored) {
      setThemeScheme({
        theme: stored.theme ?? 'light',
        scheme: stored.scheme ?? 'mint',
      });
      setLanguage((current) => normalizeLocale(stored.language ?? current));
    }
  }, [stored?.theme, stored?.scheme, stored?.language]);

  function handleThemeChange(value: {
    theme: UserPreferences['theme'];
    scheme: UserPreferences['scheme'];
  }) {
    setThemeScheme(value);
  }

  async function handleSave() {
    setSaveStatus('saving');
    try {
      await updatePrefs.mutateAsync({
        theme: themeScheme.theme,
        scheme: themeScheme.scheme,
        language,
      });
      setLocale(normalizeLocale(language));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{t('settings.subtitle')}</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-[var(--text)]">
            {t('settings.appearanceTitle')}
          </h2>
          <p className="text-sm text-[var(--muted)]">{t('settings.appearanceSubtitle')}</p>
        </CardHeader>
        <CardContent>
          <ThemePicker value={themeScheme} onChange={handleThemeChange} />
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-[var(--text)]">
            {t('settings.languageTitle')}
          </h2>
          <p className="text-sm text-[var(--muted)]">{t('settings.languageSubtitle')}</p>
        </CardHeader>
        <CardContent>
          <select
            value={language}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setLanguage(normalizeLocale(e.target.value))
            }
            className="w-full rounded-[calc(var(--radius)-4px)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-[var(--text)]">
            {t('settings.accountTitle')}
          </h2>
          <p className="text-sm text-[var(--muted)]">{t('settings.accountSubtitle')}</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">{t('settings.name')}</p>
              <p className="mt-0.5 text-sm text-[var(--text)]">{user?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">{t('settings.email')}</p>
              <p className="mt-0.5 text-sm text-[var(--text)]">{user?.email ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={() => void handleSave()} disabled={saveStatus === 'saving'}>
          {saveStatus === 'saving' ? t('common.saving') : t('settings.savePreferences')}
        </Button>

        {saveStatus === 'saved' && (
          <p className="text-sm text-[var(--primary)]">{t('settings.preferencesSaved')}</p>
        )}
        {saveStatus === 'error' && (
          <p className="text-sm text-red-500">{t('settings.preferencesSaveFailed')}</p>
        )}
      </div>
    </div>
  );
}

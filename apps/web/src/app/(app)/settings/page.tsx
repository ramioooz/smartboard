'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardHeader, CardContent, Button } from '@smartboard/ui';
import { ThemePicker } from '../../../components/settings/theme-picker';
import { useUser, useUpdatePreferences } from '../../../hooks/useUser';
import { useScheme } from '../../../hooks/useScheme';
import type { UserPreferences } from '../../../lib/auth';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

export default function SettingsPage() {
  const { data: user } = useUser();
  const { setTheme } = useTheme();
  const updatePrefs = useUpdatePreferences();

  const stored = user?.preferences as Partial<UserPreferences> | undefined;

  const [themeScheme, setThemeScheme] = useState<{
    theme: UserPreferences['theme'];
    scheme: UserPreferences['scheme'];
  }>({ theme: stored?.theme ?? 'light', scheme: stored?.scheme ?? 'mint' });

  const [language, setLanguage] = useState<string>(stored?.language ?? 'en');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Sync local state when user loads
  useEffect(() => {
    if (stored) {
      setThemeScheme({
        theme: stored.theme ?? 'light',
        scheme: stored.scheme ?? 'mint',
      });
      setLanguage(stored.language ?? 'en');
    }
  }, [stored?.theme, stored?.scheme, stored?.language]);

  // Sync scheme to html element on change
  useScheme(themeScheme.scheme);

  function handleThemeChange(value: { theme: UserPreferences['theme']; scheme: UserPreferences['scheme'] }) {
    setThemeScheme(value);
    // Instant preview
    setTheme(value.theme);
    document.documentElement.setAttribute('data-scheme', value.scheme);
  }

  async function handleSave() {
    setSaveStatus('saving');
    try {
      await updatePrefs.mutateAsync({
        theme: themeScheme.theme,
        scheme: themeScheme.scheme,
        language,
      });
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
        <h1 className="text-2xl font-bold text-[var(--text)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Manage your appearance and account preferences</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-[var(--text)]">Appearance</h2>
          <p className="text-sm text-[var(--muted)]">Choose a theme and color scheme</p>
        </CardHeader>
        <CardContent>
          <ThemePicker value={themeScheme} onChange={handleThemeChange} />
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-[var(--text)]">Language</h2>
          <p className="text-sm text-[var(--muted)]">Select your preferred language</p>
        </CardHeader>
        <CardContent>
          <select
            value={language}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)}
            className="w-full rounded-[calc(var(--radius)-4px)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            {LANGUAGES.map((lang) => (
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
          <h2 className="text-base font-semibold text-[var(--text)]">Account</h2>
          <p className="text-sm text-[var(--muted)]">Your account details</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Name</p>
              <p className="mt-0.5 text-sm text-[var(--text)]">{user?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">Email</p>
              <p className="mt-0.5 text-sm text-[var(--text)]">{user?.email ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={() => void handleSave()} disabled={saveStatus === 'saving'}>
          {saveStatus === 'saving' ? 'Saving…' : 'Save preferences'}
        </Button>

        {saveStatus === 'saved' && (
          <p className="text-sm text-[var(--primary)]">Preferences saved!</p>
        )}
        {saveStatus === 'error' && (
          <p className="text-sm text-red-500">Failed to save. Please try again.</p>
        )}
      </div>
    </div>
  );
}

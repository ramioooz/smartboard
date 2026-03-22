'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import type { UserPreferences } from '../lib/auth';
import { normalizeScheme, normalizeTheme, writeAppearanceCookies } from '../lib/appearance';

export function usePersistedAppearance(
  theme: UserPreferences['theme'] | undefined,
  scheme: UserPreferences['scheme'] | undefined,
) {
  const { setTheme } = useTheme();

  useEffect(() => {
    const nextTheme = normalizeTheme(theme);
    const nextScheme = normalizeScheme(scheme);

    setTheme(nextTheme);
    document.documentElement.setAttribute('data-scheme', nextScheme);
    writeAppearanceCookies(nextTheme, nextScheme);
  }, [scheme, setTheme, theme]);
}

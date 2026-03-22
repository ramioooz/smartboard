import type { UserPreferences } from './auth';

export const THEME_COOKIE = 'sb-theme';
export const SCHEME_COOKIE = 'sb-scheme';

export const VALID_THEMES = ['light', 'dark'] as const;
export const VALID_SCHEMES = ['mint', 'warm', 'neon', 'ember'] as const;

export const DEFAULT_THEME: UserPreferences['theme'] = 'light';
export const DEFAULT_SCHEME: UserPreferences['scheme'] = 'mint';

function isTheme(value: string | undefined): value is UserPreferences['theme'] {
  return value === 'light' || value === 'dark';
}

function isScheme(value: string | undefined): value is UserPreferences['scheme'] {
  return value === 'mint' || value === 'warm' || value === 'neon' || value === 'ember';
}

export function normalizeTheme(value: string | undefined): UserPreferences['theme'] {
  return isTheme(value) ? value : DEFAULT_THEME;
}

export function normalizeScheme(value: string | undefined): UserPreferences['scheme'] {
  return isScheme(value) ? value : DEFAULT_SCHEME;
}

export function writeAppearanceCookies(theme: UserPreferences['theme'], scheme: UserPreferences['scheme']): void {
  if (typeof document === 'undefined') return;

  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${THEME_COOKIE}=${theme}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  document.cookie = `${SCHEME_COOKIE}=${scheme}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

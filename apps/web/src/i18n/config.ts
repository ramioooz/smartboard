export const SUPPORTED_LOCALES = ['en', 'fr', 'ar'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const LOCALE_COOKIE = 'sb-language';
export const LOCALE_STORAGE_KEY = LOCALE_COOKIE;

export const LANGUAGE_OPTIONS: Array<{ value: SupportedLocale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
];

export function getLocaleDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function normalizeLocale(value?: string | null): SupportedLocale {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.toLowerCase();
  if (normalized.startsWith('ar')) return 'ar';
  if (normalized.startsWith('fr')) return 'fr';
  if (normalized.startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

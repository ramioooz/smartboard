export const SUPPORTED_LOCALES = ['en', 'fr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const LOCALE_STORAGE_KEY = 'sb-language';

export const LANGUAGE_OPTIONS: Array<{ value: SupportedLocale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
];

export function normalizeLocale(value?: string | null): SupportedLocale {
  if (!value) return DEFAULT_LOCALE;
  const normalized = value.toLowerCase();
  if (normalized.startsWith('fr')) return 'fr';
  if (normalized.startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  getLocaleDirection,
  normalizeLocale,
  type SupportedLocale,
} from './config';
import ar from './messages/ar';
import en from './messages/en';
import fr from './messages/fr';

type MessageTree<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : MessageTree<T[K]>;
};
type Messages = MessageTree<typeof en>;

const dictionaries: Record<SupportedLocale, Messages> = { en, fr, ar };

type Primitive = string | number;

type LocaleContextValue = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, vars?: Record<string, Primitive>) => string;
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function getMessage(messages: Messages, key: string): unknown {
  return key.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[part];
  }, messages);
}

function interpolate(template: string, vars?: Record<string, Primitive>) {
  if (!vars) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token: string) => String(vars[token] ?? ''));
}

function writeLocaleCookie(locale: SupportedLocale) {
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(
    locale,
  )}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
  hasInitialLocaleCookie = false,
}: {
  children: React.ReactNode;
  initialLocale?: SupportedLocale;
  hasInitialLocaleCookie?: boolean;
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale);

  useEffect(() => {
    if (hasInitialLocaleCookie) {
      return;
    }

    const cached = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const browser = window.navigator.language;
    const next = normalizeLocale(cached || browser);
    if (SUPPORTED_LOCALES.includes(next) && next !== locale) {
      setLocaleState(next);
    }
  }, [hasInitialLocaleCookie, locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getLocaleDirection(locale);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    writeLocaleCookie(locale);
  }, [locale]);

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(normalizeLocale(next));
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, Primitive>) => {
      const active = dictionaries[locale];
      const raw = getMessage(active, key) ?? getMessage(dictionaries.en, key);
      if (typeof raw !== 'string') {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`Missing translation key: ${key}`);
        }
        return key;
      }
      return interpolate(raw, vars);
    },
    [locale],
  );

  const formatDate = useCallback(
    (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => {
      return new Intl.DateTimeFormat(locale, options).format(new Date(value));
    },
    [locale],
  );

  const formatDateTime = useCallback(
    (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        ...options,
      }).format(new Date(value));
    },
    [locale],
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(locale, options).format(value);
    },
    [locale],
  );

  const contextValue = useMemo(
    () => ({ locale, setLocale, t, formatDate, formatDateTime, formatNumber }),
    [locale, setLocale, t, formatDate, formatDateTime, formatNumber],
  );

  return <LocaleContext.Provider value={contextValue}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}

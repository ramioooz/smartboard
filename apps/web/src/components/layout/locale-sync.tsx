'use client';

import { useEffect } from 'react';
import { useUser } from '../../hooks/useUser';
import { normalizeLocale } from '../../i18n/config';
import { useLocale } from '../../i18n/use-t';

export function LocaleSync() {
  const { data: user } = useUser();
  const { locale, setLocale } = useLocale();

  useEffect(() => {
    const nextLocale = normalizeLocale(user?.preferences?.language);
    if (nextLocale !== locale) {
      setLocale(nextLocale);
    }
  }, [locale, setLocale, user?.preferences?.language]);

  return null;
}

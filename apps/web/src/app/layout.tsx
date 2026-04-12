import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import '../styles/globals.css';
import { Providers } from './providers';
import {
  DEFAULT_SCHEME,
  DEFAULT_THEME,
  SCHEME_COOKIE,
  THEME_COOKIE,
  normalizeScheme,
  normalizeTheme,
} from '../lib/appearance';
import { DEFAULT_LOCALE, LOCALE_COOKIE, getLocaleDirection, normalizeLocale } from '../i18n/config';

export const metadata: Metadata = {
  title: 'Smartboard',
  description: 'Multi-tenant analytics and dashboard platform',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialTheme = normalizeTheme(cookieStore.get(THEME_COOKIE)?.value ?? DEFAULT_THEME);
  const initialScheme = normalizeScheme(cookieStore.get(SCHEME_COOKIE)?.value ?? DEFAULT_SCHEME);
  const rawLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale = normalizeLocale(rawLocale ?? DEFAULT_LOCALE);
  const initialDirection = getLocaleDirection(initialLocale);

  return (
    <html
      lang={initialLocale}
      dir={initialDirection}
      suppressHydrationWarning
      data-theme={initialTheme}
      data-scheme={initialScheme}
    >
      <body>
        <Providers
          initialTheme={initialTheme}
          initialLocale={initialLocale}
          hasInitialLocaleCookie={Boolean(rawLocale)}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}

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

export const metadata: Metadata = {
  title: 'Smartboard',
  description: 'Multi-tenant analytics and dashboard platform',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialTheme = normalizeTheme(cookieStore.get(THEME_COOKIE)?.value ?? DEFAULT_THEME);
  const initialScheme = normalizeScheme(cookieStore.get(SCHEME_COOKIE)?.value ?? DEFAULT_SCHEME);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={initialTheme}
      data-scheme={initialScheme}
    >
      <body>
        <Providers initialTheme={initialTheme}>{children}</Providers>
      </body>
    </html>
  );
}

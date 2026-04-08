'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { UserPreferences } from '../lib/auth';
import { LocaleProvider } from '../i18n/provider';

export function Providers({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: UserPreferences['theme'];
}) {
  useEffect(() => {
    if (window.location.hostname !== 'localhost') {
      return;
    }

    const url = new URL(window.location.href);
    url.hostname = '127.0.0.1';
    window.location.replace(url.toString());
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme={initialTheme}
          enableSystem={false}
          storageKey="sb-theme"
        >
          {children}
        </ThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

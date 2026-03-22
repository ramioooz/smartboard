'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { UserPreferences } from '../lib/auth';

export function Providers({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: UserPreferences['theme'];
}) {
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
      <ThemeProvider
        attribute="data-theme"
        defaultTheme={initialTheme}
        enableSystem={false}
        storageKey="sb-theme"
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

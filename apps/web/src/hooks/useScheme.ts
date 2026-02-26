'use client';

import { useEffect } from 'react';

export function useScheme(scheme: string | undefined) {
  useEffect(() => {
    if (!scheme) return;
    document.documentElement.setAttribute('data-scheme', scheme);
  }, [scheme]);
}

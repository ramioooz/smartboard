'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { devLogin, getMe, getUserId, patchPreferences } from '../lib/auth';
import { getToken } from '../lib/storage';
import type { User, UserPreferences } from '../lib/auth';

export function useUser() {
  return useQuery<User>({
    queryKey: ['user'],
    queryFn: async () => {
      // A valid JWT token is the source of truth for auth state.
      // If we don't have one, auto-login (dev mode creates one immediately).
      const token = getToken();
      if (!token) {
        return devLogin();
      }
      return getMe();
    },
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation<User, Error, UserPreferences>({
    mutationFn: (prefs: UserPreferences) => {
      const userId = getUserId();
      if (!userId) throw new Error('Not logged in');
      return patchPreferences(prefs);
    },
    onSuccess: (user) => {
      qc.setQueryData(['user'], user);
    },
  });
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../lib/api';
import { clearAuth, bootstrapSession, getMe, patchPreferences } from '../lib/auth';
import type { User, UserPreferences } from '../lib/auth';

export function useUser() {
  return useQuery<User>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        return await getMe();
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
          clearAuth();
          return bootstrapSession();
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation<User, Error, UserPreferences>({
    mutationFn: (prefs: UserPreferences) => patchPreferences(prefs),
    onSuccess: (user) => {
      qc.setQueryData(['user'], user);
    },
  });
}

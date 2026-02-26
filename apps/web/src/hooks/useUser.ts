'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { devLogin, getMe, getUserId, patchPreferences, setUserId } from '../lib/auth';
import type { User, UserPreferences } from '../lib/auth';

export function useUser() {
  return useQuery<User>({
    queryKey: ['user'],
    queryFn: async () => {
      let userId = getUserId();
      if (!userId) {
        const user = await devLogin();
        setUserId(user.id);
        return user;
      }
      return getMe(userId);
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
      return patchPreferences(userId, prefs);
    },
    onSuccess: (user) => {
      qc.setQueryData(['user'], user);
    },
  });
}

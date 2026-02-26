import { apiFetch } from './api';
import type { ApiOk } from '@smartboard/shared';

export interface UserPreferences {
  theme: 'light' | 'dark';
  scheme: 'mint' | 'warm' | 'neon' | 'ember';
  language: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  preferences: Partial<UserPreferences>;
  createdAt: string;
  updatedAt: string;
}

export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sb-user-id');
}

export function setUserId(id: string): void {
  localStorage.setItem('sb-user-id', id);
}

export async function devLogin(): Promise<User> {
  const res = await apiFetch<ApiOk<User>>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'dev@local' }),
  });
  return res.data;
}

export async function getMe(userId: string): Promise<User> {
  const res = await apiFetch<ApiOk<User>>('/api/auth/me', { userId });
  return res.data;
}

export async function patchPreferences(
  userId: string,
  prefs: UserPreferences,
): Promise<User> {
  const res = await apiFetch<ApiOk<User>>('/api/auth/me/preferences', {
    method: 'PATCH',
    body: JSON.stringify(prefs),
    userId,
  });
  return res.data;
}

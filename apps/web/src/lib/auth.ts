import { apiFetch } from './api';
import type { ApiOk } from '@smartboard/shared';
import { setUserId, setToken } from './storage';

// Re-export storage helpers so the rest of the app imports them from one place
export { getUserId, setUserId, getToken, setToken, clearAuth } from './storage';

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

interface LoginResult {
  user: User;
  token: string;
}

export async function devLogin(): Promise<User> {
  const res = await apiFetch<ApiOk<LoginResult>>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'dev@local' }),
  });
  // Store both the JWT and the userId — JWT is the auth credential,
  // userId is kept for UI state (profile display, etc.)
  setToken(res.data.token);
  setUserId(res.data.user.id);
  return res.data.user;
}

/**
 * Fetch the current user profile.
 * The gateway extracts the user identity from the JWT — no userId needed here.
 */
export async function getMe(): Promise<User> {
  const res = await apiFetch<ApiOk<User>>('/api/auth/me');
  return res.data;
}

export async function patchPreferences(prefs: UserPreferences): Promise<User> {
  const res = await apiFetch<ApiOk<User>>('/api/auth/me/preferences', {
    method: 'PATCH',
    body: JSON.stringify(prefs),
  });
  return res.data;
}

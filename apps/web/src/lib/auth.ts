import { apiFetch } from './api';
import type { ApiOk } from '@smartboard/shared';
import { getGatewayUrl } from './env';

// Re-export storage helpers so the rest of the app imports them from one place
export { clearAuth } from './storage';

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

interface SessionBootstrapResult {
  user: User;
}

export async function bootstrapSession(): Promise<User> {
  const res = await apiFetch<ApiOk<SessionBootstrapResult>>('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify({}),
  });
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

export function startLogin(returnTo = '/'): void {
  const target = `${getGatewayUrl()}/api/auth/oidc/start?returnTo=${encodeURIComponent(returnTo)}`;
  window.location.assign(target);
}

export function startLogout(returnTo = '/signed-out'): void {
  const target = `${getGatewayUrl()}/api/auth/oidc/logout?returnTo=${encodeURIComponent(returnTo)}`;
  window.location.assign(target);
}

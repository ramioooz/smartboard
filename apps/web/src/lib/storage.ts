/**
 * Thin wrappers around localStorage so the rest of the app never
 * touches storage keys directly, and SSR calls never blow up.
 */

const KEY_USER_ID = 'sb-user-id';
const KEY_TOKEN = 'sb-token';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getUserId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEY_USER_ID);
}

export function setUserId(id: string): void {
  localStorage.setItem(KEY_USER_ID, id);
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEY_TOKEN);
}

export function setToken(token: string): void {
  localStorage.setItem(KEY_TOKEN, token);
}

export function clearAuth(): void {
  localStorage.removeItem(KEY_USER_ID);
  localStorage.removeItem(KEY_TOKEN);
}

/**
 * Thin wrappers around localStorage so the rest of the app never
 * touches storage keys directly, and SSR calls never blow up.
 */

const KEY_USER_ID = 'sb-user-id';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function clearAuth(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(KEY_USER_ID);
  localStorage.removeItem('sb-token');
}

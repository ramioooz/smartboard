/**
 * Best-effort cleanup for legacy browser auth keys from the pre-cookie flow.
 */

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function clearAuth(): void {
  if (!isBrowser()) return;
  localStorage.removeItem('sb-user-id');
  localStorage.removeItem('sb-token');
}

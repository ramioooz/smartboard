const STORAGE_KEY = 'sb-tenant-id';

export function getTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setTenantId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id);
}

export function clearTenantId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

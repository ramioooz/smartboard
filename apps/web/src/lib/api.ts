import { getGatewayUrl } from './env';
import { getToken } from './storage';

interface FetchOptions extends RequestInit {
  /** @deprecated Pass x-tenant-id via tenantId instead; userId is now derived from the JWT */
  userId?: string;
  tenantId?: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init: FetchOptions = {}): Promise<T> {
  const { userId, tenantId, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('Content-Type', 'application/json');

  // Prefer JWT — the gateway verifies it locally (stateless, no network call).
  // Falls back to x-user-id for DEV_BYPASS_AUTH cURL convenience.
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else if (userId) {
    headers.set('x-user-id', userId);
  }

  if (tenantId) headers.set('x-tenant-id', tenantId);

  const res = await fetch(`${getGatewayUrl()}${path}`, { ...rest, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }

  return res.json() as Promise<T>;
}

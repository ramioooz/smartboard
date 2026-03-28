import { getGatewayUrl } from './env';

interface FetchOptions extends RequestInit {
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
  const { tenantId, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('Content-Type', 'application/json');

  if (tenantId) headers.set('x-tenant-id', tenantId);

  const res = await fetch(`${getGatewayUrl()}${path}`, {
    credentials: rest.credentials ?? 'include',
    ...rest,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }

  return res.json() as Promise<T>;
}

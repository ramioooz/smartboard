const BASE =
  (typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_GATEWAY_URL
    : process.env.NEXT_PUBLIC_GATEWAY_URL) ?? 'http://localhost:4000';

interface FetchOptions extends RequestInit {
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
  if (userId) headers.set('x-user-id', userId);
  if (tenantId) headers.set('x-tenant-id', tenantId);

  const res = await fetch(`${BASE}${path}`, { ...rest, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }

  return res.json() as Promise<T>;
}

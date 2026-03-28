export const ACCESS_TOKEN_COOKIE = 'sb_access_token';
export const REFRESH_TOKEN_COOKIE = 'sb_refresh_token';

type SameSite = 'Lax' | 'Strict' | 'None';

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: SameSite;
  path?: string;
  maxAge?: number;
  expires?: Date;
}

function encodeCookieValue(value: string): string {
  return encodeURIComponent(value);
}

export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const parts = [`${name}=${encodeCookieValue(value)}`];

  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (typeof options.maxAge === 'number') parts.push(`Max-Age=${options.maxAge}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);

  return parts.join('; ');
}

export function clearCookie(name: string, secure: boolean): string {
  return serializeCookie(name, '', {
    path: '/',
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    maxAge: 0,
    expires: new Date(0),
  });
}

export function shouldUseSecureCookies(): boolean {
  return process.env['NODE_ENV'] === 'production';
}

export function getAccessTokenCookieTtlSeconds(): number {
  return Number(process.env['ACCESS_TOKEN_COOKIE_TTL_SECONDS'] ?? '900');
}

export function getRefreshTokenCookieTtlSeconds(): number {
  return Number(process.env['REFRESH_TOKEN_COOKIE_TTL_SECONDS'] ?? '2592000');
}

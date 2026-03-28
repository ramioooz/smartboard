const REVOKED_SESSION_KEY_PREFIX = 'auth:revoked-session:';

export function getRevokedSessionKey(sessionId: string): string {
  return `${REVOKED_SESSION_KEY_PREFIX}${sessionId}`;
}

export function getRevokedSessionTtlSeconds(
  expiresAt: Date,
  now: Date = new Date(),
): number {
  const ttlMs = expiresAt.getTime() - now.getTime();
  return Math.max(1, Math.ceil(ttlMs / 1000));
}

import {
  LogoutAllSessionsSchema,
  LogoutSessionSchema,
  OidcCallbackQuerySchema,
  OidcStartQuerySchema,
  RefreshSessionSchema,
} from '@smartboard/shared';

describe('gateway auth shared schemas', () => {
  it('accepts an optional refresh token payload', () => {
    expect(RefreshSessionSchema.safeParse({}).success).toBe(true);
    expect(RefreshSessionSchema.safeParse({ refreshToken: 'rt-123' }).success).toBe(true);
  });

  it('accepts an optional logout session payload', () => {
    expect(LogoutSessionSchema.safeParse({}).success).toBe(true);
    expect(LogoutSessionSchema.safeParse({ sessionId: 'session-123' }).success).toBe(true);
  });

  it('accepts an empty logout-all payload', () => {
    expect(LogoutAllSessionsSchema.safeParse({}).success).toBe(true);
  });

  it('accepts OIDC start and callback query shapes', () => {
    expect(OidcStartQuerySchema.safeParse({ returnTo: '/dashboards' }).success).toBe(true);
    expect(
      OidcCallbackQuerySchema.safeParse({
        code: 'auth-code',
        state: 'signed-state',
      }).success,
    ).toBe(true);
  });
});

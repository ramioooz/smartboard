import { verify } from 'jsonwebtoken';
import { TokenService } from '../src/auth/token.service';

describe('TokenService', () => {
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...env,
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '15m',
      JWT_ISSUER: 'smartboard-auth',
      JWT_AUDIENCE: 'smartboard-web',
    };
  });

  afterAll(() => {
    process.env = env;
  });

  it('issues an access token with user and session claims', () => {
    const service = new TokenService();

    const token = service.issueAccessToken({
      userId: 'user-123',
      sessionId: 'session-456',
    });

    const payload = verify(token, process.env.JWT_SECRET as string, {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    }) as { sub: string; sid: string };

    expect(payload.sub).toBe('user-123');
    expect(payload.sid).toBe('session-456');
  });

  it('hashes refresh tokens deterministically', () => {
    const service = new TokenService();

    expect(service.hashRefreshToken('same-token')).toBe(service.hashRefreshToken('same-token'));
    expect(service.hashRefreshToken('same-token')).not.toBe(service.hashRefreshToken('other-token'));
  });

  it('issues opaque refresh tokens', () => {
    const service = new TokenService();

    const token = service.issueRefreshToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(32);
  });
});

import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { sign } from 'jsonwebtoken';
import { AuthGuard } from '../src/common/guards/auth.guard';

describe('AuthGuard', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = {
      ...env,
      JWT_SECRET: 'gateway-secret',
    };
  });

  afterAll(() => {
    process.env = env;
  });

  function buildGuard(options?: {
    isPublic?: boolean;
    revoked?: boolean;
    headers?: Record<string, string | undefined>;
  }) {
    const ctx = { requestId: 'req-1' } as {
      requestId: string;
      userId?: string;
      sessionId?: string;
      tenantId?: string;
    };
    const guard = new AuthGuard(
      {
        getAllAndOverride: jest.fn().mockReturnValue(options?.isPublic ?? false),
      } as unknown as Reflector,
      {
        get: jest.fn(() => ctx),
      } as never,
      {
        isRevoked: jest.fn().mockResolvedValue(options?.revoked ?? false),
      } as never,
    );

    const executionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: options?.headers ?? {},
        }),
      }),
    };

    return { guard, ctx, executionContext };
  }

  it('allows public routes without auth', async () => {
    const { guard, executionContext } = buildGuard({ isPublic: true });

    await expect(guard.canActivate(executionContext as never)).resolves.toBe(true);
  });

  it('accepts a bearer token and writes user, session, and tenant to the request context', async () => {
    const token = sign({ sub: 'user-1', sid: 'session-1' }, process.env.JWT_SECRET as string);
    const { guard, ctx, executionContext } = buildGuard({
      headers: {
        authorization: `Bearer ${token}`,
        'x-tenant-id': 'tenant-1',
      },
    });

    await expect(guard.canActivate(executionContext as never)).resolves.toBe(true);
    expect(ctx.userId).toBe('user-1');
    expect(ctx.sessionId).toBe('session-1');
    expect(ctx.tenantId).toBe('tenant-1');
  });

  it('falls back to the auth cookie when no bearer token is present', async () => {
    const token = sign({ sub: 'user-2', sid: 'session-2' }, process.env.JWT_SECRET as string);
    const { guard, ctx, executionContext } = buildGuard({
      headers: {
        cookie: `sb_access_token=${token}`,
      },
    });

    await expect(guard.canActivate(executionContext as never)).resolves.toBe(true);
    expect(ctx.userId).toBe('user-2');
    expect(ctx.sessionId).toBe('session-2');
  });

  it('rejects revoked sessions even when the JWT signature is valid', async () => {
    const token = sign({ sub: 'user-3', sid: 'session-3' }, process.env.JWT_SECRET as string);
    const { guard, executionContext } = buildGuard({
      revoked: true,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    await expect(guard.canActivate(executionContext as never)).rejects.toThrow(
      new UnauthorizedException('Session revoked'),
    );
  });

  it('rejects requests without a bearer or cookie token', async () => {
    const { guard, executionContext } = buildGuard();

    await expect(guard.canActivate(executionContext as never)).rejects.toThrow(
      new UnauthorizedException('Missing authentication token'),
    );
  });
});

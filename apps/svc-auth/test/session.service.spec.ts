import { UnauthorizedException } from '@nestjs/common';
import type { RefreshToken, Session } from '@prisma/client';
import { SessionService } from '../src/auth/session.service';

describe('SessionService', () => {
  const now = new Date('2026-03-28T00:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  function buildService(overrides?: {
    existingToken?: (RefreshToken & { session: Session }) | null;
    sessions?: Array<{ id: string; expiresAt: Date }>;
  }) {
    const replacement = { id: 'rt-next' };
    const prisma: any = {
      session: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(
          overrides?.existingToken?.session
            ? {
                id: overrides.existingToken.session.id,
                expiresAt: overrides.existingToken.session.expiresAt,
              }
            : null,
        ),
        findMany: jest.fn(),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue(replacement),
        findUnique: jest.fn().mockResolvedValue(overrides?.existingToken ?? null),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (arg: unknown) => {
        if (typeof arg === 'function') {
          return arg({
            refreshToken: prisma.refreshToken,
            session: prisma.session,
          });
        }

        return Promise.all(arg as Array<Promise<unknown>>);
      }),
    };

    const tokenService = {
      issueRefreshToken: jest
        .fn()
        .mockReturnValue('refresh-next'),
      hashRefreshToken: jest.fn((token: string) => `hash:${token}`),
    };

    const sessionRevocationService = {
      markRevoked: jest.fn(),
      markManyRevoked: jest.fn(),
    };

    const service = new SessionService(
      prisma as never,
      tokenService as never,
      sessionRevocationService as never,
    );

    return { service, prisma, tokenService, sessionRevocationService, replacement };
  }

  it('creates a refresh token record with a hashed token', async () => {
    const { service, prisma } = buildService();

    const result = await service.createRefreshToken('session-1');

    expect(result.token).toBe('refresh-next');
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId: 'session-1',
        tokenHash: 'hash:refresh-next',
      }),
    });
  });

  it('rotates a usable refresh token and returns the session plus next token', async () => {
    const existing = {
      id: 'rt-1',
      sessionId: 'session-1',
      tokenHash: 'hash:refresh-current',
      expiresAt: new Date('2026-04-10T00:00:00.000Z'),
      usedAt: null,
      revokedAt: null,
      replacedById: null,
      createdAt: now,
      session: {
        id: 'session-1',
        userId: 'user-1',
        provider: 'DEV',
        externalSubject: 'dev@local',
        ipAddress: null,
        userAgent: null,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: null,
        expiresAt: new Date('2026-04-10T00:00:00.000Z'),
        revokedAt: null,
      } as Session,
    } satisfies RefreshToken & { session: Session };
    const { service, prisma } = buildService({ existingToken: existing });

    const result = await service.rotateRefreshToken('refresh-current');

    expect(result.session.id).toBe('session-1');
    expect(result.refreshToken).toBe('refresh-next');
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId: 'session-1',
        tokenHash: 'hash:refresh-next',
      }),
    });
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt-1' },
      data: expect.objectContaining({
        replacedById: 'rt-next',
      }),
    });
    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: expect.objectContaining({
        lastSeenAt: expect.any(Date),
      }),
    });
  });

  it('revokes the full session when a used refresh token is replayed', async () => {
    const existing = {
      id: 'rt-1',
      sessionId: 'session-1',
      tokenHash: 'hash:refresh-used',
      expiresAt: new Date('2026-04-10T00:00:00.000Z'),
      usedAt: new Date('2026-03-28T00:05:00.000Z'),
      revokedAt: null,
      replacedById: 'rt-2',
      createdAt: now,
      session: {
        id: 'session-1',
        userId: 'user-1',
        provider: 'DEV',
        externalSubject: 'dev@local',
        ipAddress: null,
        userAgent: null,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: null,
        expiresAt: new Date('2026-04-10T00:00:00.000Z'),
        revokedAt: null,
      } as Session,
    } satisfies RefreshToken & { session: Session };
    const { service, prisma, sessionRevocationService } = buildService({ existingToken: existing });

    await expect(service.rotateRefreshToken('refresh-used')).rejects.toThrow(
      new UnauthorizedException('Refresh token reuse detected'),
    );

    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(sessionRevocationService.markRevoked).toHaveBeenCalledWith(
      'session-1',
      existing.session.expiresAt,
    );
  });
});

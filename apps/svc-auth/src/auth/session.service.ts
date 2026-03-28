import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthProvider, RefreshToken, Session } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';
import type { SessionMetadata } from './identity.types';
import { SessionRevocationService } from './session-revocation.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly sessionRevocationService: SessionRevocationService,
  ) {}

  async createSession(params: {
    userId: string;
    provider: AuthProvider;
    externalSubject?: string;
    metadata?: SessionMetadata;
  }): Promise<Session> {
    return this.prisma.session.create({
      data: {
        userId: params.userId,
        provider: params.provider,
        externalSubject: params.externalSubject,
        ipAddress: params.metadata?.ipAddress,
        userAgent: params.metadata?.userAgent,
        expiresAt: this.buildSessionExpiry(),
      },
    });
  }

  async createRefreshToken(sessionId: string): Promise<{ token: string; record: RefreshToken }> {
    const token = this.tokenService.issueRefreshToken();
    const record = await this.prisma.refreshToken.create({
      data: {
        sessionId,
        tokenHash: this.tokenService.hashRefreshToken(token),
        expiresAt: this.buildRefreshExpiry(),
      },
    });

    return { token, record };
  }

  async rotateRefreshToken(rawToken: string): Promise<{ session: Session; refreshToken: string }> {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.tokenService.hashRefreshToken(rawToken) },
      include: { session: true },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (this.isRefreshTokenReuse(existing)) {
      await this.revokeSession(existing.sessionId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (!this.isRefreshTokenUsable(existing)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const nextRawToken = this.tokenService.issueRefreshToken();
    const nextHash = this.tokenService.hashRefreshToken(nextRawToken);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const replacement = await tx.refreshToken.create({
        data: {
          sessionId: existing.sessionId,
          tokenHash: nextHash,
          expiresAt: this.buildRefreshExpiry(),
        },
      });

      await tx.refreshToken.update({
        where: { id: existing.id },
        data: {
          usedAt: now,
          replacedById: replacement.id,
        },
      });

      await tx.session.update({
        where: { id: existing.sessionId },
        data: { lastSeenAt: now },
      });

      return replacement;
    });

    return {
      session: existing.session,
      refreshToken: nextRawToken,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    const now = new Date();
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, expiresAt: true },
    });
    if (!session) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: now },
      }),
      this.prisma.refreshToken.updateMany({
        where: { sessionId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
    await this.sessionRevocationService.markRevoked(session.id, session.expiresAt);
  }

  async revokeAllSessionsForUser(userId: string): Promise<number> {
    const now = new Date();
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      select: { id: true, expiresAt: true },
    });

    if (sessions.length === 0) {
      return 0;
    }

    const sessionIds = sessions.map((session) => session.id);
    await this.prisma.$transaction([
      this.prisma.session.updateMany({
        where: {
          id: { in: sessionIds },
          revokedAt: null,
        },
        data: { revokedAt: now },
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          sessionId: { in: sessionIds },
          revokedAt: null,
        },
        data: { revokedAt: now },
      }),
    ]);

    await this.sessionRevocationService.markManyRevoked(
      sessions.map((session) => ({ id: session.id, expiresAt: session.expiresAt })),
    );
    return sessionIds.length;
  }

  private buildSessionExpiry(): Date {
    const ttlDays = Number(process.env['SESSION_TTL_DAYS'] ?? '30');
    const now = new Date();
    now.setDate(now.getDate() + ttlDays);
    return now;
  }

  private buildRefreshExpiry(): Date {
    const ttlDays = Number(process.env['REFRESH_TOKEN_TTL_DAYS'] ?? process.env['SESSION_TTL_DAYS'] ?? '30');
    const now = new Date();
    now.setDate(now.getDate() + ttlDays);
    return now;
  }

  private isRefreshTokenUsable(token: RefreshToken & { session: Session }): boolean {
    const now = Date.now();
    if (token.usedAt || token.revokedAt) return false;
    if (token.expiresAt.getTime() <= now) return false;
    if (token.session.revokedAt) return false;
    if (token.session.expiresAt.getTime() <= now) return false;
    return true;
  }

  private isRefreshTokenReuse(token: RefreshToken & { session: Session }): boolean {
    return Boolean(token.usedAt || token.replacedById) && !token.session.revokedAt;
  }
}

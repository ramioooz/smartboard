import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { AuthProvider, User } from '@prisma/client';
import type { UserPreferencesSchema } from '@smartboard/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { ExternalIdentity, SessionMetadata } from './identity.types';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

type UserPreferences = ReturnType<typeof UserPreferencesSchema.parse>;

export interface LoginResult {
  user: User;
  sessionId: string;
  refreshToken: string;
  /** Signed HS256 JWT — verify locally in the gateway with JWT_SECRET */
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
  ) {}

  async login(email: string, metadata?: SessionMetadata): Promise<LoginResult> {
    this.assertDevBypassEnabled();
    const identity = this.resolveDevIdentity(email);
    return this.createSessionFromIdentity(identity, metadata);
  }

  async createSession(metadata?: SessionMetadata): Promise<LoginResult> {
    this.assertDevBypassEnabled();
    const email = process.env['DEV_DEFAULT_EMAIL'] ?? 'dev@local';
    const identity = this.resolveDevIdentity(email);
    return this.createSessionFromIdentity(identity, metadata);
  }

  async refreshSession(refreshToken: string): Promise<LoginResult> {
    const rotated = await this.sessionService.rotateRefreshToken(refreshToken);
    const user = await this.me(rotated.session.userId);
    const token = this.tokenService.issueAccessToken({
      userId: user.id,
      sessionId: rotated.session.id,
    });

    return {
      user,
      sessionId: rotated.session.id,
      refreshToken: rotated.refreshToken,
      token,
    };
  }

  async logout(sessionId?: string): Promise<void> {
    if (!sessionId) {
      throw new UnauthorizedException('Missing session id');
    }
    await this.sessionService.revokeSession(sessionId);
  }

  private async createSessionFromIdentity(
    identity: ExternalIdentity,
    metadata?: SessionMetadata,
  ): Promise<LoginResult> {
    const user = await this.findOrCreateUser(identity);
    const session = await this.sessionService.createSession({
      userId: user.id,
      provider: identity.provider,
      externalSubject: identity.externalId,
      metadata,
    });
    const refreshToken = await this.sessionService.createRefreshToken(session.id);
    const token = this.tokenService.issueAccessToken({
      userId: user.id,
      sessionId: session.id,
    });

    return { user, sessionId: session.id, refreshToken: refreshToken.token, token };
  }

  async findOrCreateUser(identity: ExternalIdentity): Promise<User> {
    return this.prisma.user.upsert({
      where: { email: identity.email },
      update: {
        updatedAt: new Date(),
        name: identity.name ?? undefined,
      },
      create: {
        email: identity.email,
        name: identity.name ?? null,
        preferences: {},
      },
    });
  }

  async me(userId: string): Promise<User> {
    try {
      return await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    } catch {
      throw new NotFoundException(`User ${userId} not found`);
    }
  }

  async updatePreferences(userId: string, prefs: UserPreferences): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { preferences: prefs as object },
      });
    } catch {
      throw new NotFoundException(`User ${userId} not found`);
    }
  }

  private resolveDevIdentity(email: string): ExternalIdentity {
    return {
      provider: 'DEV' as AuthProvider,
      externalId: email,
      email,
      name: email.split('@')[0],
    };
  }

  private assertDevBypassEnabled(): void {
    if (process.env['DEV_BYPASS_AUTH'] !== 'true') {
      throw new UnauthorizedException('Interactive login required');
    }
  }
}

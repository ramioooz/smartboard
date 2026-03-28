import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import type { User } from '@prisma/client';
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
    const identity = this.resolveDevIdentity(email);
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
      provider: AuthProvider.DEV,
      externalId: email,
      email,
      name: email.split('@')[0],
    };
  }
}

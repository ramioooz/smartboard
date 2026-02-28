import { Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { UserPreferencesSchema } from '@smartboard/shared';
import { requireEnv } from '@smartboard/shared';
import { sign } from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

type UserPreferences = ReturnType<typeof UserPreferencesSchema.parse>;

export interface LoginResult {
  user: User;
  /** Signed HS256 JWT — verify locally in the gateway with JWT_SECRET */
  token: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string): Promise<LoginResult> {
    const user = await this.prisma.user.upsert({
      where: { email },
      update: { updatedAt: new Date() },
      create: {
        email,
        name: email.split('@')[0],
        preferences: {},
      },
    });

    // JWT_EXPIRES_IN defaults to 15m — short-lived is intentional.
    // For longer sessions, pair this with a refresh-token endpoint.
    // The cast is needed because @types/jsonwebtoken narrows expiresIn to
    // a template-literal StringValue type, but any ms-compatible string works at runtime.
    const expiresIn = (process.env['JWT_EXPIRES_IN'] ?? '15m') as SignOptions['expiresIn'];
    const token = sign({ sub: user.id }, requireEnv('JWT_SECRET'), { expiresIn });

    return { user, token };
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
}

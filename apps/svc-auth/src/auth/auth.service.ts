import { Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { UserPreferencesSchema } from '@smartboard/shared';
import { PrismaService } from '../prisma/prisma.service';

type UserPreferences = ReturnType<typeof UserPreferencesSchema.parse>;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string): Promise<User> {
    return this.prisma.user.upsert({
      where: { email },
      update: { updatedAt: new Date() },
      create: {
        email,
        name: email.split('@')[0],
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
}

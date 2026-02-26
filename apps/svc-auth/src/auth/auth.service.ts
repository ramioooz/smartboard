import { Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';

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
}

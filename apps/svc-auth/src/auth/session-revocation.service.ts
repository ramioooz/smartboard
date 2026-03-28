import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { getRevokedSessionKey, getRevokedSessionTtlSeconds, requireEnv } from '@smartboard/shared';

@Injectable()
export class SessionRevocationService implements OnModuleDestroy {
  private readonly redis = new Redis(requireEnv('REDIS_URL'), {
    lazyConnect: true,
  });

  async markRevoked(sessionId: string, expiresAt: Date): Promise<void> {
    await this.redis.set(
      getRevokedSessionKey(sessionId),
      '1',
      'EX',
      getRevokedSessionTtlSeconds(expiresAt),
    );
  }

  async markManyRevoked(sessions: Array<{ id: string; expiresAt: Date }>): Promise<void> {
    if (sessions.length === 0) return;

    const pipeline = this.redis.pipeline();
    for (const session of sessions) {
      pipeline.set(
        getRevokedSessionKey(session.id),
        '1',
        'EX',
        getRevokedSessionTtlSeconds(session.expiresAt),
      );
    }
    await pipeline.exec();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis.status !== 'end') {
      await this.redis.quit();
    }
  }
}

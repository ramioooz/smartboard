import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { getRevokedSessionKey, requireEnv } from '@smartboard/shared';

@Injectable()
export class SessionRevocationService implements OnModuleDestroy {
  private readonly redis = new Redis(requireEnv('REDIS_URL'), {
    lazyConnect: true,
  });

  async isRevoked(sessionId: string): Promise<boolean> {
    const result = await this.redis.exists(getRevokedSessionKey(sessionId));
    return result === 1;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis.status !== 'end') {
      await this.redis.quit();
    }
  }
}

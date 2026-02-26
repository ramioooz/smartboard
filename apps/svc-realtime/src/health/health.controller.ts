import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult, HealthIndicatorResult } from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService, private redis: RedisService) {}

  @Get('live')
  live(): { status: string; service: string; timestamp: string } {
    return { status: 'ok', service: 'smartboard-svc-realtime', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        const ok = await this.redis.ping();
        return { redis: { status: ok ? 'up' : 'down' } };
      },
    ]);
  }
}

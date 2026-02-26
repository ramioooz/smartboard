import { Controller, Get } from '@nestjs/common';
import type { HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { HealthCheck } from '@nestjs/terminus';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Public()
  @Get('live')
  live(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'smartboard-gateway',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    // Gateway has no direct DB/Redis — just verify process is healthy
    return this.health.check([]);
  }
}

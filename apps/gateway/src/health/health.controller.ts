import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get('live')
  live(): { status: string; service: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'smartboard-gateway',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    // Gateway has no direct DB/Redis — just verify process is healthy
    return this.health.check([]);
  }
}

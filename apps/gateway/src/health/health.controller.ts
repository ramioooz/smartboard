import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from '@nestjs/terminus';
import type { HealthCheckResult } from '@nestjs/terminus';
import { HealthCheck } from '@nestjs/terminus';
import { Public } from '../common/decorators/public.decorator';
import { getInstanceId } from '@smartboard/shared';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Public()
  @Get('live')
  live(): { status: string; service: string; instance: string; timestamp: string } {
    return {
      status: 'ok',
      service: 'smartboard-gateway',
      instance: getInstanceId(),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  async ready(): Promise<HealthCheckResult & { instance: string }> {
    // Gateway has no direct DB/Redis — just verify process is healthy
    const result = await this.health.check([]);
    return { ...result, instance: getInstanceId() };
  }
}

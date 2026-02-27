import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from '@nestjs/terminus';
import type { HealthCheckResult, HealthIndicatorResult } from '@nestjs/terminus';
import { HealthCheck } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { getInstanceId } from '@smartboard/shared';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService, private prisma: PrismaService) {}

  @Get('live')
  live(): { status: string; service: string; instance: string; timestamp: string } {
    return { status: 'ok', service: 'smartboard-svc-analytics', instance: getInstanceId(), timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @HealthCheck()
  async ready(): Promise<HealthCheckResult & { instance: string }> {
    const result = await this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        await this.prisma.$queryRaw`SELECT 1`;
        return { database: { status: 'up' } };
      },
    ]);
    return { ...result, instance: getInstanceId() };
  }
}

import { BadRequestException, Controller, Get, Headers, Query } from '@nestjs/common';
import type { ApiOk, DatasetMetricsQuery, TimeseriesQuery } from '@smartboard/shared';
import { DatasetMetricsQuerySchema, TimeseriesQuerySchema } from '@smartboard/shared';
import { ZodValidationPipe } from '@smartboard/nest-common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('metrics')
  async metrics(
    @Headers('x-tenant-id') tenantId: string,
    @Query(new ZodValidationPipe(DatasetMetricsQuerySchema)) query: DatasetMetricsQuery,
  ): Promise<ApiOk<unknown>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const rows = await this.analyticsService.metrics(query, tenantId);
    return { ok: true, data: rows };
  }

  @Get('timeseries')
  async timeseries(
    @Headers('x-tenant-id') tenantId: string,
    @Query(new ZodValidationPipe(TimeseriesQuerySchema)) query: TimeseriesQuery,
  ): Promise<ApiOk<unknown>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const rows = await this.analyticsService.timeseries(query, tenantId);
    return { ok: true, data: rows };
  }
}

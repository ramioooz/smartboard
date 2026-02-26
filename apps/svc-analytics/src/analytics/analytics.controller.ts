import { BadRequestException, Controller, Get, Headers, Query } from '@nestjs/common';
import type { ApiOk } from '@smartboard/shared';
import { TimeseriesQuerySchema } from '@smartboard/shared';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('timeseries')
  async timeseries(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: Record<string, string>,
  ): Promise<ApiOk<unknown>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const parsed = TimeseriesQuerySchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten().fieldErrors);
    const rows = await this.analyticsService.timeseries(parsed.data, tenantId);
    return { ok: true, data: rows };
  }
}

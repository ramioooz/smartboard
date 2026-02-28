import { Controller, Get, Query } from '@nestjs/common';
import type { ApiOk } from '@smartboard/shared';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('timeseries')
  async timeseries(@Query() query: Record<string, string>): Promise<ApiOk<unknown>> {
    const qs = new URLSearchParams(query).toString();
    return this.analyticsService.get<ApiOk<unknown>>(`/analytics/timeseries?${qs}`);
  }
}

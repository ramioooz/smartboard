import { Controller, Get, Query } from '@nestjs/common';
import type { ApiOk } from '@smartboard/shared';
import { AnalyticsClient } from '../../services/clients/analytics.client';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsClient: AnalyticsClient) {}

  @Get('timeseries')
  async timeseries(@Query() query: Record<string, string>): Promise<ApiOk<unknown>> {
    const qs = new URLSearchParams(query).toString();
    return this.analyticsClient.get<ApiOk<unknown>>(`/analytics/timeseries?${qs}`);
  }
}

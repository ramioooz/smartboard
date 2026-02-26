import { Body, Controller, Get, Post } from '@nestjs/common';
import type { ApiOk } from '@smartboard/shared';
import type { DashboardsClient } from '../../services/clients/dashboards.client';

@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsClient: DashboardsClient) {}

  @Post()
  async create(@Body() body: unknown): Promise<ApiOk<unknown>> {
    return this.dashboardsClient.post<ApiOk<unknown>>('/dashboards', body);
  }

  @Get()
  async list(): Promise<ApiOk<unknown>> {
    return this.dashboardsClient.get<ApiOk<unknown>>('/dashboards');
  }
}

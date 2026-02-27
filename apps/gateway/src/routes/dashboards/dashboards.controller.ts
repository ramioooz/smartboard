import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
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

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiOk<unknown>> {
    return this.dashboardsClient.get<ApiOk<unknown>>(`/dashboards/${id}`);
  }

  @Put(':id/layout')
  async saveLayout(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<ApiOk<unknown>> {
    return this.dashboardsClient.put<ApiOk<unknown>>(`/dashboards/${id}/layout`, body);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<ApiOk<unknown>> {
    return this.dashboardsClient.patch<ApiOk<unknown>>(`/dashboards/${id}`, body);
  }
}

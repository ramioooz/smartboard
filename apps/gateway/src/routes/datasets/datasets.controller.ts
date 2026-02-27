import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type { ApiOk } from '@smartboard/shared';
import type { DatasetsClient } from '../../services/clients/datasets.client';

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsClient: DatasetsClient) {}

  @Post()
  async create(@Body() body: unknown): Promise<ApiOk<unknown>> {
    return this.datasetsClient.post<ApiOk<unknown>>('/datasets', body);
  }

  @Get()
  async list(@Query() query: Record<string, string>): Promise<ApiOk<unknown>> {
    const qs = new URLSearchParams(query).toString();
    const path = qs ? `/datasets?${qs}` : '/datasets';
    return this.datasetsClient.get<ApiOk<unknown>>(path);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiOk<unknown>> {
    return this.datasetsClient.get<ApiOk<unknown>>(`/datasets/${id}`);
  }
}

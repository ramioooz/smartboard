import { Body, Controller, Get, Post } from '@nestjs/common';
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
  async list(): Promise<ApiOk<unknown>> {
    return this.datasetsClient.get<ApiOk<unknown>>('/datasets');
  }
}

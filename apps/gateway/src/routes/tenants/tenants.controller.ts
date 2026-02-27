import { Body, Controller, Get, Post } from '@nestjs/common';
import type { ApiOk } from '@smartboard/shared';
import { TenantsClient } from '../../services/clients/tenants.client';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsClient: TenantsClient) {}

  @Post()
  async create(@Body() body: unknown): Promise<ApiOk<unknown>> {
    return this.tenantsClient.post<ApiOk<unknown>>('/tenants', body);
  }

  @Get()
  async list(): Promise<ApiOk<unknown>> {
    return this.tenantsClient.get<ApiOk<unknown>>('/tenants');
  }
}

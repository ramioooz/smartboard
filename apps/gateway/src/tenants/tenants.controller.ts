import { Body, Controller, Get, Post } from '@nestjs/common';
import type { ApiOk } from '@smartboard/shared';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  async create(@Body() body: unknown): Promise<ApiOk<unknown>> {
    return this.tenantsService.post<ApiOk<unknown>>('/tenants', body);
  }

  @Get()
  async list(): Promise<ApiOk<unknown>> {
    return this.tenantsService.get<ApiOk<unknown>>('/tenants');
  }
}

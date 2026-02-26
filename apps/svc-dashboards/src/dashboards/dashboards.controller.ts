import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Post, Query } from '@nestjs/common';
import type { ApiOk, PagedResult } from '@smartboard/shared';
import { CreateDashboardSchema, PaginationSchema } from '@smartboard/shared';
import type { Dashboard } from '@prisma/client';
import type { DashboardsService } from './dashboards.service';

@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: unknown,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<ApiOk<Dashboard>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const parsed = CreateDashboardSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten().fieldErrors);
    const dashboard = await this.dashboardsService.create(parsed.data, tenantId);
    return { ok: true, data: dashboard };
  }

  @Get()
  async list(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: Record<string, string>,
  ): Promise<ApiOk<PagedResult<Dashboard>>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const pagination = PaginationSchema.parse(query);
    const result = await this.dashboardsService.listForTenant(tenantId, pagination);
    return { ok: true, data: result };
  }
}

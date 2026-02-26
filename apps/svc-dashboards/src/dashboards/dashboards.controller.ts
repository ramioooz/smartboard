import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import type { ApiOk, PagedResult } from '@smartboard/shared';
import { CreateDashboardSchema, PaginationSchema, SaveLayoutSchema } from '@smartboard/shared';
import type { Dashboard } from '@prisma/client';
import { DashboardsService } from './dashboards.service';

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

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<ApiOk<Dashboard>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const dashboard = await this.dashboardsService.findOne(id, tenantId);
    return { ok: true, data: dashboard };
  }

  @Put(':id/layout')
  async saveLayout(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: unknown,
  ): Promise<ApiOk<Dashboard>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const parsed = SaveLayoutSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten().fieldErrors);
    const dashboard = await this.dashboardsService.saveLayout(id, tenantId, parsed.data);
    return { ok: true, data: dashboard };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: unknown,
  ): Promise<ApiOk<Dashboard>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const parsed = (body as { name?: string; description?: string }) ?? {};
    const dashboard = await this.dashboardsService.update(id, tenantId, parsed);
    return { ok: true, data: dashboard };
  }
}

import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';
import type { ApiOk, CreateDashboard, PatchDashboard, Pagination, PagedResult, SaveLayout } from '@smartboard/shared';
import { CreateDashboardSchema, PatchDashboardSchema, PaginationSchema, SaveLayoutSchema } from '@smartboard/shared';
import { ZodValidationPipe } from '@smartboard/nest-common';
import type { Dashboard } from '@prisma/client';
import { DashboardsService } from './dashboards.service';

@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body(new ZodValidationPipe(CreateDashboardSchema)) body: CreateDashboard,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<ApiOk<Dashboard>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const dashboard = await this.dashboardsService.create(body, tenantId);
    return { ok: true, data: dashboard };
  }

  @Get()
  async list(
    @Headers('x-tenant-id') tenantId: string,
    @Query(new ZodValidationPipe(PaginationSchema)) pagination: Pagination,
  ): Promise<ApiOk<PagedResult<Dashboard>>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
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
    @Body(new ZodValidationPipe(SaveLayoutSchema)) body: SaveLayout,
  ): Promise<ApiOk<Dashboard>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const dashboard = await this.dashboardsService.saveLayout(id, tenantId, body);
    return { ok: true, data: dashboard };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body(new ZodValidationPipe(PatchDashboardSchema)) body: PatchDashboard,
  ): Promise<ApiOk<Dashboard>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const dashboard = await this.dashboardsService.update(id, tenantId, body);
    return { ok: true, data: dashboard };
  }
}

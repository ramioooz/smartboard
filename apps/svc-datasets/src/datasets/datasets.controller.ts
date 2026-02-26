import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Post, Query } from '@nestjs/common';
import type { ApiOk, PagedResult } from '@smartboard/shared';
import { CreateDatasetSchema, PaginationSchema } from '@smartboard/shared';
import type { Dataset } from '@prisma/client';
import type { DatasetsService } from './datasets.service';

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: unknown,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<ApiOk<Dataset>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const parsed = CreateDatasetSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten().fieldErrors);
    const dataset = await this.datasetsService.create(parsed.data, tenantId);
    return { ok: true, data: dataset };
  }

  @Get()
  async list(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: Record<string, string>,
  ): Promise<ApiOk<PagedResult<Dataset>>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const pagination = PaginationSchema.parse(query);
    const result = await this.datasetsService.listForTenant(tenantId, pagination);
    return { ok: true, data: result };
  }
}

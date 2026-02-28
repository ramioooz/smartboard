import { BadRequestException, Body, Controller, Get, Headers, HttpCode, NotFoundException, Param, Post, Query } from '@nestjs/common';
import type { ApiOk, CreateDataset, Pagination, PagedResult } from '@smartboard/shared';
import { CreateDatasetSchema, PaginationSchema } from '@smartboard/shared';
import { ZodValidationPipe } from '@smartboard/nest-common';
import type { Dataset } from '@prisma/client';
import { DatasetsService } from './datasets.service';
import type { CreateDatasetResult } from './datasets.service';

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body(new ZodValidationPipe(CreateDatasetSchema)) body: CreateDataset,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<ApiOk<CreateDatasetResult>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const result = await this.datasetsService.create(body, tenantId);
    return { ok: true, data: result };
  }

  @Get()
  async list(
    @Headers('x-tenant-id') tenantId: string,
    @Query(new ZodValidationPipe(PaginationSchema)) pagination: Pagination,
  ): Promise<ApiOk<PagedResult<Dataset>>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const result = await this.datasetsService.listForTenant(tenantId, pagination);
    return { ok: true, data: result };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<ApiOk<Dataset>> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');
    const dataset = await this.datasetsService.findOne(id, tenantId);
    if (!dataset) throw new NotFoundException(`Dataset ${id} not found`);
    return { ok: true, data: dataset };
  }
}

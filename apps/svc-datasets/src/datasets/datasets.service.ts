import { Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Dataset } from '@prisma/client';
import { Queue } from 'bullmq';
import type { CreateDatasetSchema, PaginationSchema } from '@smartboard/shared';
import { JOB_NAMES } from '@smartboard/shared';
import type { DatasetIngestPayload, PagedResult } from '@smartboard/shared';
import type { PrismaService } from '../prisma/prisma.service';
import type { RedisService } from '../redis/redis.service';

type CreateDatasetDto = ReturnType<typeof CreateDatasetSchema.parse>;
type PaginationDto = ReturnType<typeof PaginationSchema.parse>;

@Injectable()
export class DatasetsService implements OnModuleInit, OnModuleDestroy {
  private queue!: Queue<DatasetIngestPayload>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit(): void {
    this.queue = new Queue<DatasetIngestPayload>(JOB_NAMES.DATASET_INGEST, {
      connection: this.redis.getClient(),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }

  async create(dto: CreateDatasetDto, tenantId: string): Promise<Dataset> {
    const dataset = await this.prisma.dataset.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        fileType: dto.fileType,
        status: 'created',
      },
    });

    await this.queue.add(JOB_NAMES.DATASET_INGEST, {
      tenantId,
      datasetId: dataset.id,
      s3Key: '',
      fileType: dto.fileType,
    } satisfies DatasetIngestPayload);

    return dataset;
  }

  async listForTenant(tenantId: string, pagination: PaginationDto): Promise<PagedResult<Dataset>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.dataset.count({ where: { tenantId } }),
      this.prisma.dataset.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { items, total, page, limit, hasMore: skip + items.length < total };
  }
}

import { Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Dataset } from '@prisma/client';
import { Queue } from 'bullmq';
import type { CreateDatasetSchema, PaginationSchema } from '@smartboard/shared';
import { JOB_NAMES } from '@smartboard/shared';
import type { DatasetIngestPayload, PagedResult } from '@smartboard/shared';
import type { PrismaService } from '../prisma/prisma.service';
import type { RedisService } from '../redis/redis.service';
import type { MinioService } from '../minio/minio.service';

type CreateDatasetDto = ReturnType<typeof CreateDatasetSchema.parse>;
type PaginationDto = ReturnType<typeof PaginationSchema.parse>;

export interface CreateDatasetResult {
  dataset: Dataset;
  uploadUrl: string;
}

@Injectable()
export class DatasetsService implements OnModuleInit, OnModuleDestroy {
  private queue!: Queue<DatasetIngestPayload>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly minio: MinioService,
  ) {}

  onModuleInit(): void {
    this.queue = new Queue<DatasetIngestPayload>(JOB_NAMES.DATASET_INGEST, {
      connection: this.redis.getClient(),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }

  async create(dto: CreateDatasetDto, tenantId: string): Promise<CreateDatasetResult> {
    // Create the dataset record first to get the id
    const dataset = await this.prisma.dataset.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        fileType: dto.fileType,
        status: 'created',
      },
    });

    // Build a deterministic S3 key
    const ext = dto.fileType === 'json' ? 'json' : 'csv';
    const s3Key = `tenants/${tenantId}/datasets/${dataset.id}/data.${ext}`;

    // Store the s3Key so the worker knows where to read from
    const updated = await this.prisma.dataset.update({
      where: { id: dataset.id },
      data: { s3Key, status: 'uploaded' },
    });

    // Generate a presigned PUT URL — client uploads directly to MinIO
    const uploadUrl = await this.minio.presignedPutUrl(s3Key);

    // Queue the ingest job with a 5 s delay to let the client finish uploading
    await this.queue.add(
      JOB_NAMES.DATASET_INGEST,
      { tenantId, datasetId: dataset.id, s3Key, fileType: dto.fileType } satisfies DatasetIngestPayload,
      { delay: 5_000 },
    );

    return { dataset: updated, uploadUrl };
  }

  async listForTenant(tenantId: string, pagination: PaginationDto): Promise<PagedResult<Dataset>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
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

  async findOne(id: string, tenantId: string): Promise<Dataset | null> {
    return this.prisma.dataset.findFirst({ where: { id, tenantId } });
  }
}

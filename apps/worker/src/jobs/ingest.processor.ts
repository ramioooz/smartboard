import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import type { Job } from 'bullmq';
import type { DatasetIngestPayload } from '@smartboard/shared';
import { JOB_NAMES } from '@smartboard/shared';
import type { PrismaService } from '../prisma/prisma.service';
import type { RedisService } from '../redis/redis.service';

@Injectable()
export class IngestProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IngestProcessor.name);
  private worker!: Worker<DatasetIngestPayload>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker<DatasetIngestPayload>(
      JOB_NAMES.DATASET_INGEST,
      (job) => this.process(job),
      { connection: this.redis.getClient() },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed for dataset ${job.data.datasetId}`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.close();
  }

  private async process(job: Job<DatasetIngestPayload>): Promise<void> {
    const { tenantId, datasetId, s3Key, fileType } = job.data;
    this.logger.log(`Processing ingest job — datasetId=${datasetId}, fileType=${fileType}`);

    const record = await this.prisma.jobRecord.create({
      data: { tenantId, datasetId, status: 'running' },
    });

    try {
      // Phase 4 stub — real CSV/JSON parsing and Event row insertion in Phase 5
      this.logger.log(`[stub] Would ingest s3Key="${s3Key}" for dataset ${datasetId}`);

      // Update dataset status to ready via cross-schema raw SQL
      await this.prisma.$executeRaw`
        UPDATE datasets."Dataset"
        SET status = 'ready', "updatedAt" = NOW()
        WHERE id = ${datasetId}
      `;

      await this.prisma.jobRecord.update({
        where: { id: record.id },
        data: { status: 'completed', finishedAt: new Date() },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.prisma.jobRecord.update({
        where: { id: record.id },
        data: { status: 'failed', error: message, finishedAt: new Date() },
      });
      throw err;
    }
  }
}

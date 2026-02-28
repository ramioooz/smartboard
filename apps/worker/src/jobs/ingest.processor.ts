import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import type { Job } from 'bullmq';
import { parse as parseCsv } from 'csv-parse';
import * as Minio from 'minio';
import type { DatasetIngestPayload } from '@smartboard/shared';
import { JOB_NAMES, EVENT_NAMES, EVENT_CHANNEL, requireEnv } from '@smartboard/shared';
import type { DatasetReadyEvent, DatasetErrorEvent } from '@smartboard/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface EventRow {
  tenantId: string;
  datasetId: string;
  metric: string;
  value: number;
  timestamp: Date;
}

@Injectable()
export class IngestProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IngestProcessor.name);
  private worker!: Worker<DatasetIngestPayload>;
  private minio!: Minio.Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit(): void {
    this.minio = new Minio.Client({
      endPoint: requireEnv('MINIO_ENDPOINT'),
      port: parseInt(requireEnv('MINIO_PORT'), 10),
      useSSL: process.env['MINIO_USE_SSL'] === 'true',
      accessKey: requireEnv('MINIO_ROOT_USER'),
      secretKey: requireEnv('MINIO_ROOT_PASSWORD'),
    });

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
    this.logger.log(`Processing ingest — datasetId=${datasetId}, s3Key=${s3Key}`);

    const record = await this.prisma.jobRecord.create({
      data: { tenantId, datasetId, status: 'running' },
    });

    try {
      // 1. Stream the file from MinIO
      const stream = await this.minio.getObject(
        requireEnv('MINIO_BUCKET_DATASETS'),
        s3Key,
      );

      // 2. Parse into EventRow[]
      const rows = fileType === 'json'
        ? await this.parseJson(stream, tenantId, datasetId)
        : await this.parseCsv(stream, tenantId, datasetId);

      this.logger.log(`Parsed ${rows.length} rows from ${s3Key}`);

      // 3. Bulk-insert into analytics.events
      if (rows.length > 0) {
        await this.prisma.$executeRaw`
          INSERT INTO analytics.events ("id", "tenantId", "datasetId", metric, value, timestamp, properties)
          SELECT
            gen_random_uuid(),
            r."tenantId",
            r."datasetId",
            r.metric,
            r.value,
            r.timestamp,
            '{}'::jsonb
          FROM jsonb_to_recordset(${JSON.stringify(
            rows.map((r) => ({
              tenantId: r.tenantId,
              datasetId: r.datasetId,
              metric: r.metric,
              value: r.value,
              timestamp: r.timestamp.toISOString(),
            }))
          )}::jsonb) AS r("tenantId" text, "datasetId" text, metric text, value float8, timestamp timestamptz)
        `;
      }

      // 4. Update dataset status → ready
      await this.prisma.$executeRaw`
        UPDATE datasets."Dataset"
        SET status = 'ready', "rowCount" = ${rows.length}, "updatedAt" = NOW()
        WHERE id = ${datasetId}
      `;

      // 5. Update job record
      await this.prisma.jobRecord.update({
        where: { id: record.id },
        data: { status: 'completed', finishedAt: new Date() },
      });

      // 6. Publish dataset.ready event to Redis pub/sub
      const event: DatasetReadyEvent = {
        event: EVENT_NAMES.DATASET_READY,
        tenantId,
        datasetId,
        rowCount: rows.length,
        processedAt: new Date().toISOString(),
      };
      await this.redis.getClient().publish(EVENT_CHANNEL, JSON.stringify(event));
      this.logger.log(`Published ${EVENT_NAMES.DATASET_READY} to ${EVENT_CHANNEL} for dataset ${datasetId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      await this.prisma.jobRecord.update({
        where: { id: record.id },
        data: { status: 'failed', error: message, finishedAt: new Date() },
      });

      // Update dataset status → error
      await this.prisma.$executeRaw`
        UPDATE datasets."Dataset"
        SET status = 'error', "updatedAt" = NOW()
        WHERE id = ${datasetId}
      `;

      // Publish dataset.error event
      const event: DatasetErrorEvent = {
        event: EVENT_NAMES.DATASET_ERROR,
        tenantId,
        datasetId,
        reason: message,
        failedAt: new Date().toISOString(),
      };
      await this.redis.getClient().publish(EVENT_CHANNEL, JSON.stringify(event));

      throw err;
    }
  }

  /** Parse a CSV stream. Expects headers: metric, value, timestamp (ISO).
   *  Any extra columns are ignored. Missing timestamp defaults to now. */
  private parseCsv(stream: NodeJS.ReadableStream, tenantId: string, datasetId: string): Promise<EventRow[]> {
    return new Promise((resolve, reject) => {
      const rows: EventRow[] = [];
      const parser = parseCsv({ columns: true, skip_empty_lines: true, trim: true });

      parser.on('readable', () => {
        let record: Record<string, string>;
        while ((record = parser.read() as Record<string, string>) !== null) {
          const metric = record['metric'] ?? 'value';
          const value = parseFloat(record['value'] ?? '0');
          const ts = record['timestamp'] ? new Date(record['timestamp']) : new Date();
          if (!isNaN(value)) {
            rows.push({ tenantId, datasetId, metric, value, timestamp: ts });
          }
        }
      });

      parser.on('error', reject);
      parser.on('end', () => resolve(rows));
      stream.pipe(parser);
    });
  }

  /** Parse a JSON stream. Accepts array of { metric, value, timestamp? }. */
  private parseJson(stream: NodeJS.ReadableStream, tenantId: string, datasetId: string): Promise<EventRow[]> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => {
        try {
          const raw = JSON.parse(Buffer.concat(chunks).toString('utf-8')) as unknown;
          const arr = Array.isArray(raw) ? raw : [];
          const rows: EventRow[] = [];
          for (const item of arr as Record<string, unknown>[]) {
            const metric = typeof item['metric'] === 'string' ? item['metric'] : 'value';
            const value = typeof item['value'] === 'number' ? item['value'] : parseFloat(String(item['value'] ?? '0'));
            const ts = typeof item['timestamp'] === 'string' ? new Date(item['timestamp']) : new Date();
            if (!isNaN(value)) {
              rows.push({ tenantId, datasetId, metric, value, timestamp: ts });
            }
          }
          resolve(rows);
        } catch (e) {
          reject(e);
        }
      });
    });
  }
}

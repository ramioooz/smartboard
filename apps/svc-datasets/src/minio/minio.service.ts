import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { requireEnv } from '@smartboard/shared';

const BUCKET = requireEnv('MINIO_BUCKET_DATASETS');
const PRESIGNED_TTL = 15 * 60; // 15 minutes

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client!: Minio.Client;

  onModuleInit(): void {
    this.client = new Minio.Client({
      endPoint: requireEnv('MINIO_ENDPOINT'),
      port: parseInt(requireEnv('MINIO_PORT'), 10),
      useSSL: process.env['MINIO_USE_SSL'] === 'true',
      accessKey: requireEnv('MINIO_ROOT_USER'),
      secretKey: requireEnv('MINIO_ROOT_PASSWORD'),
    });
  }

  /** Ensure the bucket exists (idempotent). */
  async ensureBucket(): Promise<void> {
    const exists = await this.client.bucketExists(BUCKET);
    if (!exists) {
      await this.client.makeBucket(BUCKET, 'us-east-1');
      this.logger.log(`Created bucket: ${BUCKET}`);
    }
  }

  /** Return a presigned PUT URL valid for PRESIGNED_TTL seconds. */
  async presignedPutUrl(objectKey: string): Promise<string> {
    await this.ensureBucket();
    return this.client.presignedPutObject(BUCKET, objectKey, PRESIGNED_TTL);
  }

  /** Stream-read an object from MinIO. */
  async getObject(objectKey: string): Promise<NodeJS.ReadableStream> {
    return this.client.getObject(BUCKET, objectKey);
  }
}

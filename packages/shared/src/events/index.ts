/**
 * BullMQ job and Redis pub/sub event schemas for the smartboard platform.
 */

// ─── Job Names ────────────────────────────────────────────────────────────────

export const JOB_NAMES = {
  DATASET_INGEST: 'dataset.ingest',
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

// ─── Job Payloads ─────────────────────────────────────────────────────────────

export interface DatasetIngestPayload {
  tenantId: string;
  datasetId: string;
  s3Key: string;   // MinIO/S3 object key
  fileType: 'csv' | 'json';
}

// ─── Redis pub/sub channel ────────────────────────────────────────────────────

/**
 * Single fan-out channel for all platform events.
 *
 * Every service that publishes events writes to this one channel.
 * Every service that subscribes (svc-realtime) subscribes to this one channel.
 * Adding a new event type only requires updating EVENT_NAMES and SmartboardEvent —
 * svc-realtime and the worker never need to change their channel config.
 */
export const EVENT_CHANNEL = 'smartboard:events';

// ─── Event Names (discriminator values in the payload) ────────────────────────

export const EVENT_NAMES = {
  DATASET_READY: 'dataset.ready',
  DATASET_ERROR: 'dataset.error',
} as const;

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

// ─── Event Payloads ───────────────────────────────────────────────────────────

export interface DatasetReadyEvent {
  event: 'dataset.ready';
  tenantId: string;
  datasetId: string;
  rowCount: number;
  processedAt: string; // ISO 8601
}

export interface DatasetErrorEvent {
  event: 'dataset.error';
  tenantId: string;
  datasetId: string;
  reason: string;
  failedAt: string; // ISO 8601
}

export type SmartboardEvent = DatasetReadyEvent | DatasetErrorEvent;

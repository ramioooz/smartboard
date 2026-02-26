# @smartboard/worker

BullMQ job processor — async dataset ingestion worker.

## Responsibilities
- Consume `dataset.ingest` jobs from BullMQ queue
- Download CSV from MinIO
- Parse and aggregate data
- Write aggregates to `analytics` schema
- Update dataset status in `datasets` schema (created → uploaded → processing → ready | error)
- Publish `dataset.ready` or `dataset.error` to Redis pub/sub
- Idempotent processing (safe to retry)

## Port
`4070` (health checks only, no public routes)

## Key Endpoints
| Method | Path | Description |
|---|---|---|
| `GET` | `/health/live` | Liveness |
| `GET` | `/health/ready` | Readiness (Redis + DB + MinIO checks) |

## Environment Variables
| Variable | Description |
|---|---|
| `REDIS_URL` | BullMQ connection |
| `DATABASE_URL_ANALYTICS` | analytics schema |
| `DATABASE_URL_DATASETS` | datasets schema (status updates) |
| `MINIO_ENDPOINT` | MinIO for CSV download |
| `MINIO_BUCKET_DATASETS` | Bucket name |

## How to Run
```bash
pnpm --filter @smartboard/worker dev
```

## Role in Big Picture
The async backbone. Decouples the upload request from heavy processing. By running as a separate ECS task, ingestion throughput scales independently from the API tier. BullMQ provides retries, dead-letter queues, and job deduplication.

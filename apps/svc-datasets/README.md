# @smartboard/svc-datasets

Dataset metadata management and ingestion orchestration.

## Responsibilities
- Dataset record CRUD (metadata only — binary stored in MinIO)
- Presigned upload URL generation (MinIO)
- Ingestion job enqueueing (BullMQ `dataset.ingest`)
- Dataset status state machine: created → uploaded → processing → ready → error
- Idempotent job dispatch (deduped by datasetId)

## Port
`4030`

## Key Endpoints (internal)
| Method | Path | Description |
|---|---|---|
| `POST` | `/internal/datasets` | Create dataset metadata |
| `GET` | `/internal/datasets` | List datasets (tenantId scoped) |
| `GET` | `/internal/datasets/:id` | Get dataset |
| `POST` | `/internal/datasets/:id/upload-url` | Presigned PUT URL |
| `POST` | `/internal/datasets/:id/ingest` | Enqueue ingestion job |
| `PATCH` | `/internal/datasets/:id/status` | Update status (called by Worker) |
| `GET` | `/health/live` | Liveness |
| `GET` | `/health/ready` | Readiness (DB + Redis + MinIO checks) |

## Environment Variables
| Variable | Description |
|---|---|
| `DATABASE_URL` | Points to `datasets` schema |
| `REDIS_URL` | BullMQ connection |
| `MINIO_ENDPOINT` | MinIO host |
| `MINIO_BUCKET_DATASETS` | MinIO bucket name |

## How to Run
```bash
pnpm --filter @smartboard/svc-datasets dev
```

## Role in Big Picture
Acts as the coordinator for the dataset lifecycle. Hands off binary storage to MinIO and async processing to the Worker via BullMQ.

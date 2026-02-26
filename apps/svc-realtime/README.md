# @smartboard/svc-realtime

Real-time push service — broadcasts dataset-ready events to browser clients.

## Responsibilities
- Subscribe to Redis pub/sub channel for `dataset.ready` events
- Broadcast to tenant-scoped SSE or WebSocket rooms
- Tenant isolation enforced (clients only receive events for their tenant)

## Port
`4060`

## Key Endpoints
| Method | Path | Description |
|---|---|---|
| `GET` | `/realtime/events` | SSE stream (tenant-scoped) |
| `GET` | `/health/live` | Liveness |
| `GET` | `/health/ready` | Readiness (Redis check) |

## Environment Variables
| Variable | Description |
|---|---|
| `REDIS_URL` | Redis pub/sub connection |
| `SESSION_SECRET` | Validate session cookie for SSE auth |

## How to Run
```bash
pnpm --filter @smartboard/svc-realtime dev
```

## Role in Big Picture
After the Worker completes dataset ingestion, it publishes `dataset.ready` to Redis. svc-realtime subscribes and pushes the event to all SSE clients in the affected tenant channel. The web app receives this and triggers a TanStack Query cache invalidation.

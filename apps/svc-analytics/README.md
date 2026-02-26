# @smartboard/svc-analytics

Analytics query service — serves aggregated timeseries and KPI data.

## Responsibilities
- Timeseries queries with server-side bucketing (minute/hour/day/week/month)
- KPI aggregations (sum, avg, count, min, max)
- Tenant-scoped queries (enforces tenantId at DB layer)
- Never returns raw rows — always aggregated (protects performance)

## Port
`4040`

## Key Endpoints (internal)
| Method | Path | Description |
|---|---|---|
| `GET` | `/internal/analytics/timeseries` | Bucketed timeseries for a dataset+metric |
| `GET` | `/internal/analytics/kpi` | KPI aggregation |
| `GET` | `/health/live` | Liveness |
| `GET` | `/health/ready` | Readiness (DB check) |

## Environment Variables
| Variable | Description |
|---|---|
| `DATABASE_URL` | Points to `analytics` schema |

## How to Run
```bash
pnpm --filter @smartboard/svc-analytics dev
```

## Role in Big Picture
Query-only service. The Worker writes aggregates here after ingesting CSVs. The Gateway exposes `/analytics/timeseries` which maps directly to this service.

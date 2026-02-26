# @smartboard/svc-dashboards

Dashboard and panel persistence service.

## Responsibilities
- Dashboard CRUD (per tenant)
- Panel layout persistence (react-grid-layout compatible)
- Panel config storage (type, datasetId, chart config)

## Port
`4050`

## Key Endpoints (internal)
| Method | Path | Description |
|---|---|---|
| `POST` | `/internal/dashboards` | Create dashboard |
| `GET` | `/internal/dashboards` | List dashboards (tenantId scoped) |
| `GET` | `/internal/dashboards/:id` | Get dashboard with panels |
| `PUT` | `/internal/dashboards/:id` | Update dashboard metadata |
| `PUT` | `/internal/dashboards/:id/layout` | Save full panel layout |
| `GET` | `/health/live` | Liveness |
| `GET` | `/health/ready` | Readiness (DB check) |

## Environment Variables
| Variable | Description |
|---|---|
| `DATABASE_URL` | Points to `dashboards` schema |

## How to Run
```bash
pnpm --filter @smartboard/svc-dashboards dev
```

## Role in Big Picture
Persists the dashboard builder state. The web app sends layout snapshots here whenever the user saves the dashboard. Panels reference datasetIds which analytics resolves at query time.

# @smartboard/gateway

NestJS API edge layer — the single entry point for all web client requests.

## Responsibilities
- AuthGuard → TenantGuard global guard chain
- AsyncLocalStorage RequestContext (requestId, userId, tenantId)
- Request-ID propagation (x-request-id header in/out + downstream)
- Pino structured logging with requestId on every line
- Per-domain feature modules (auth, tenants, datasets, analytics, dashboards, realtime)
- Shared `BaseService` for HTTP proxying to downstream services
- Consistent API error shape for frontend
- Route handlers mapping to internal services

## Port
`4000`

## Structure
```
src/
  auth/         auth.module.ts  auth.controller.ts  auth.service.ts
  tenants/      tenants.module.ts  tenants.controller.ts  tenants.service.ts
  datasets/     datasets.module.ts  datasets.controller.ts  datasets.service.ts
  analytics/    analytics.module.ts  analytics.controller.ts  analytics.service.ts
  dashboards/   dashboards.module.ts  dashboards.controller.ts  dashboards.service.ts
  realtime/     realtime.module.ts  realtime.controller.ts  realtime.service.ts
  common/       base.service.ts  guards/  filters/  decorators/  interceptors/
  context/      request-context.module.ts (AsyncLocalStorage @Global)
  health/       health.module.ts  health.controller.ts
  app.module.ts
  main.ts
```

## Key Endpoints
| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Login (DEV bypass or real auth) |
| `GET` | `/auth/me` | Current user |
| `PATCH` | `/auth/me/preferences` | Update user preferences |
| `GET/POST` | `/tenants` | List/create tenants |
| `GET/POST` | `/datasets` | List/create datasets |
| `GET` | `/datasets/:id` | Get dataset by ID |
| `GET/POST` | `/dashboards` | List/create dashboards |
| `GET` | `/dashboards/:id` | Get dashboard by ID |
| `PUT` | `/dashboards/:id/layout` | Save panel layout |
| `PATCH` | `/dashboards/:id` | Update dashboard |
| `GET` | `/analytics/timeseries` | Timeseries query |
| `GET` | `/realtime/stream` | SSE event stream (proxied) |
| `GET` | `/health/live` | Liveness check |
| `GET` | `/health/ready` | Readiness check |

## Environment Variables
| Variable | Description |
|---|---|
| `AUTH_SERVICE_URL` | svc-auth base URL |
| `TENANTS_SERVICE_URL` | svc-tenants base URL |
| `DATASETS_SERVICE_URL` | svc-datasets base URL |
| `ANALYTICS_SERVICE_URL` | svc-analytics base URL |
| `DASHBOARDS_SERVICE_URL` | svc-dashboards base URL |
| `REALTIME_SERVICE_URL` | svc-realtime base URL |
| `JWT_SECRET` | JWT signing secret |
| `SESSION_SECRET` | Cookie session secret |
| `DEV_BYPASS_AUTH` | Skip JWT — pass x-user-id + x-tenant-id headers directly (default: false) |
| `LOG_LEVEL` | Pino log level (default: info) |
| `PORT` | HTTP port (default: 4000) |

## How to Run
```bash
pnpm --filter @smartboard/gateway dev
```

## Role in Big Picture
The gateway is the ONLY service the browser talks to. It authenticates the user, validates tenant membership, and proxies requests to internal services with validated context headers (x-tenant-id, x-user-id, x-request-id).

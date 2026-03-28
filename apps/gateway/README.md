# @smartboard/gateway

NestJS API edge layer — the single entry point for all web client requests.

## Responsibilities
- **ThrottlerBehindProxyGuard** → **AuthGuard** → **TenantGuard** global guard chain
- Rate limiting: Redis-backed `@nestjs/throttler` (Layer 2) on top of nginx limits (Layer 1)
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
    guards/
      auth.guard.ts         — JWT verification, hydrates RequestContext
      tenant.guard.ts       — tenant membership validation
      throttler.guard.ts    — Fastify-aware proxy guard (reads X-Forwarded-For)
  context/      request-context.module.ts (AsyncLocalStorage @Global)
  health/       health.module.ts  health.controller.ts
  app.module.ts
  main.ts
```

## Rate Limiting

Two-layer strategy — see root [README.md](../../README.md#rate-limiting) for the full picture.

**Gateway layer (Layer 2):**

| Throttler | Default limit | Auth login override |
|-----------|--------------|---------------------|
| `short`   | 20 / 1 s     | 5 / 15 min          |
| `medium`  | 300 / 1 min  | 10 / 15 min         |
| `long`    | 5 000 / 1 hr | 30 / 24 hr          |

- Storage: Redis (`gw:throttle:` key prefix) — shared across all replicas
- Tracker: last entry in `X-Forwarded-For` (real client IP set by nginx)
- Health endpoints: `@SkipThrottle()` — never rate limited

## Key Endpoints
| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/session` | Browser session bootstrap (local dev bypass today, OIDC-backed later) |
| `POST` | `/auth/login` | Legacy local-only dev bypass |
| `GET` | `/auth/oidc/start` | Start Microsoft OIDC login or local dev redirect bootstrap |
| `GET` | `/auth/oidc/callback` | Complete Microsoft OIDC login and set auth cookies |
| `POST` | `/auth/session/refresh` | Rotate refresh token and renew cookies |
| `POST` | `/auth/logout` | Revoke current session and clear auth cookies |
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
| `REDIS_URL` | Redis connection URL — used by ThrottlerModule for shared rate-limit counters |
| `JWT_SECRET` | JWT signing secret |
| `SESSION_SECRET` | Cookie session secret |
| `LOG_LEVEL` | Pino log level (default: info) |
| `PORT` | HTTP port (default: 4000) |

## How to Run
```bash
pnpm --filter @smartboard/gateway dev
```

## Role in Big Picture
The gateway is the ONLY service the browser talks to. It authenticates the user, validates tenant membership, and proxies requests to internal services with validated context headers (x-tenant-id, x-user-id, x-request-id).

# @smartboard/gateway

NestJS API edge layer — the single entry point for all web client requests.

## Responsibilities
- AuthGuard → TenantGuard global guard chain
- AsyncLocalStorage RequestContext (requestId, userId, tenantId)
- Request-ID propagation (x-request-id header in/out + downstream)
- Pino structured logging with requestId on every line
- Internal HTTP clients per service (auth, tenants, datasets, analytics, dashboards)
- Consistent API error shape for frontend
- Swagger/OpenAPI docs
- Microsoft OIDC scaffold + DEV bypass login endpoint
- Route handlers mapping to internal services

## Port
`4000`

## Key Endpoints
| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/dev-login` | DEV only — mint session for dev@local |
| `GET` | `/auth/microsoft/start` | Redirect to Microsoft OIDC |
| `GET` | `/auth/microsoft/callback` | OIDC callback |
| `POST` | `/auth/logout` | Clear session |
| `GET` | `/me` | Current user |
| `GET/PUT` | `/me/preferences` | Theme + scheme preferences |
| `GET/POST` | `/tenants` | List/create tenants |
| `POST` | `/tenants/:id/invite` | Invite member (stub) |
| `GET/POST` | `/datasets` | List/create datasets |
| `POST` | `/datasets/:id/upload-url` | Presigned MinIO URL |
| `POST` | `/datasets/:id/ingest` | Trigger ingestion job |
| `GET/POST` | `/dashboards` | List/create dashboards |
| `GET/PUT` | `/dashboards/:id` | Get/update dashboard |
| `PUT` | `/dashboards/:id/layout` | Save panel layout |
| `GET` | `/analytics/timeseries` | Timeseries query |
| `GET` | `/health/live` | Liveness check |
| `GET` | `/health/ready` | Readiness check |

## Environment Variables
| Variable | Description |
|---|---|
| `AUTH_BASE_URL` | svc-auth base URL |
| `TENANTS_BASE_URL` | svc-tenants base URL |
| `DATASETS_BASE_URL` | svc-datasets base URL |
| `ANALYTICS_BASE_URL` | svc-analytics base URL |
| `DASHBOARDS_BASE_URL` | svc-dashboards base URL |
| `SESSION_SECRET` | Cookie session secret |
| `DEV_BYPASS_AUTH` | Enable dev login endpoint |

## How to Run
```bash
pnpm --filter @smartboard/gateway dev
```

## Role in Big Picture
The gateway is the ONLY service the browser talks to. It authenticates the user, validates tenant membership, and proxies requests to internal services with validated context headers (x-tenant-id, x-user-id, x-request-id).

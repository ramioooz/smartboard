# @smartboard/svc-tenants

Tenant (workspace) management service.

## Responsibilities
- Tenant/workspace CRUD
- Membership management (OWNER, ADMIN, VIEWER)
- Invite flow (stub in MVP)
- Membership validation (called by Gateway TenantGuard)

## Port
`4020`

## Key Endpoints (internal)
| Method | Path | Description |
|---|---|---|
| `GET` | `/internal/tenants` | List tenants for userId |
| `POST` | `/internal/tenants` | Create tenant |
| `GET` | `/internal/tenants/:id/membership` | Validate user membership |
| `POST` | `/internal/tenants/:id/invites` | Create invite |
| `GET` | `/health/live` | Liveness |
| `GET` | `/health/ready` | Readiness (DB check) |

## Environment Variables
| Variable | Description |
|---|---|
| `DATABASE_URL` | Points to `tenants` schema |

## How to Run
```bash
pnpm --filter @smartboard/svc-tenants dev
```

## Role in Big Picture
TenantGuard in the Gateway calls `/internal/tenants/:id/membership` to validate that the requesting user belongs to the requested tenant before setting ctx.tenantId.

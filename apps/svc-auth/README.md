# @smartboard/svc-auth

Authentication and user management service.

## Responsibilities
- User record storage (auth schema)
- Session / JWT issuance and validation
- Microsoft OIDC token exchange
- User preferences persistence (theme, scheme)
- Refresh token management

## Port
`4010`

## Key Endpoints (internal, called by Gateway)
| Method | Path | Description |
|---|---|---|
| `POST` | `/internal/sessions` | Create session (dev bypass or OIDC) |
| `DELETE` | `/internal/sessions/:id` | Invalidate session |
| `GET` | `/internal/users/:id` | Get user by ID |
| `GET/PUT` | `/internal/users/:id/preferences` | Get/update preferences |
| `GET` | `/health/live` | Liveness |
| `GET` | `/health/ready` | Readiness (DB check) |

## Environment Variables
| Variable | Description |
|---|---|
| `DATABASE_URL` | Points to `auth` schema |
| `JWT_SECRET` | JWT signing key |
| `MICROSOFT_CLIENT_ID` | Azure App Registration client ID |
| `MICROSOFT_CLIENT_SECRET` | Azure App Registration client secret |
| `MICROSOFT_TENANT_ID` | Azure AD tenant ID |

## How to Run
```bash
pnpm --filter @smartboard/svc-auth dev
```

## Role in Big Picture
The authoritative source for user identity. Only the Gateway calls this service. Never exposed publicly.

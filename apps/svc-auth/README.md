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
| `POST` | `/auth/session` | Backend-owned session bootstrap for local dev |
| `POST` | `/auth/login` | Legacy local-only dev bypass |
| `GET` | `/auth/oidc/start` | Build Microsoft OIDC authorization URL or local dev redirect bootstrap |
| `GET` | `/auth/oidc/callback` | Exchange authorization code, create session, and return redirect target |
| `POST` | `/auth/session/refresh` | Rotate refresh token and issue new access token |
| `POST` | `/auth/logout` | Revoke a session |
| `POST` | `/auth/logout-all` | Revoke every session for the current user |
| `GET` | `/auth/me` | Get current user by forwarded identity |
| `PATCH` | `/auth/me/preferences` | Update current user preferences |
| `GET` | `/health/live` | Liveness |
| `GET` | `/health/ready` | Readiness (DB check) |

## Environment Variables
| Variable | Description |
|---|---|
| `DATABASE_URL` | Points to `auth` schema |
| `JWT_SECRET` | JWT signing key |
| `DEV_BYPASS_AUTH` | Enables the local dev auth shortcut |
| `DEV_DEFAULT_EMAIL` | Default local dev identity for `/auth/session` |
| `MICROSOFT_CLIENT_ID` | Azure App Registration client ID |
| `MICROSOFT_CLIENT_SECRET` | Azure App Registration client secret |
| `MICROSOFT_TENANT_ID` | Azure AD tenant ID |
| `MICROSOFT_REDIRECT_URI` | Public callback URI registered with Microsoft |

## How to Run
```bash
pnpm --filter @smartboard/svc-auth dev
```

## Role in Big Picture
The authoritative source for user identity. Only the Gateway calls this service. Never exposed publicly.

# @smartboard/svc-auth

Authentication and user management service.

## Responsibilities

- User record storage (auth schema)
- Session / JWT issuance
- Microsoft OIDC token exchange
- User preferences persistence (theme, scheme)
- Refresh token rotation and revocation publishing

## Port

`4010`

## Key Endpoints (internal, called by Gateway)

| Method  | Path                    | Description                                                             |
| ------- | ----------------------- | ----------------------------------------------------------------------- |
| `POST`  | `/auth/session`         | Backend-owned session bootstrap for local dev                           |
| `GET`   | `/auth/oidc/start`      | Build Microsoft OIDC authorization URL or local dev redirect bootstrap  |
| `GET`   | `/auth/oidc/callback`   | Exchange authorization code, create session, and return redirect target |
| `GET`   | `/auth/oidc/logout`     | Build Microsoft logout URL or local dev redirect                        |
| `POST`  | `/auth/session/refresh` | Rotate refresh token and issue new access token                         |
| `POST`  | `/auth/logout`          | Revoke a session                                                        |
| `POST`  | `/auth/logout-all`      | Revoke every session for the current user                               |
| `GET`   | `/auth/me`              | Get current user by forwarded identity                                  |
| `PATCH` | `/auth/me/preferences`  | Update current user preferences                                         |
| `GET`   | `/health/live`          | Liveness                                                                |
| `GET`   | `/health/ready`         | Readiness (DB check)                                                    |

## Environment Variables

| Variable                             | Description                                                               |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `DATABASE_URL`                       | Points to `auth` schema                                                   |
| `REDIS_URL`                          | Redis connection URL used to publish revoked session IDs                  |
| `JWT_SECRET`                         | JWT signing key                                                           |
| `DEV_BYPASS_AUTH`                    | Enables backend-owned local dev session bootstrap                         |
| `DEV_DEFAULT_EMAIL`                  | Default local dev identity used by `/auth/session` when bypass is enabled |
| `MICROSOFT_CLIENT_ID`                | Azure App Registration client ID                                          |
| `MICROSOFT_CLIENT_SECRET`            | Azure App Registration client secret                                      |
| `MICROSOFT_TENANT_ID`                | Azure AD tenant ID                                                        |
| `MICROSOFT_REDIRECT_URI`             | Public callback URI registered with Microsoft                             |
| `MICROSOFT_POST_LOGOUT_REDIRECT_URI` | Public post-logout callback URI registered with Microsoft                 |

## Microsoft OIDC Local Configuration

For local Docker development through nginx, register these redirect URIs on the Azure App Registration:

```text
http://127.0.0.1/api/auth/oidc/callback
http://127.0.0.1/api/auth/oidc/logout/callback
```

Use these matching local values:

```env
MICROSOFT_CLIENT_ID=8be73881-15cf-44fc-9275-ee9208e83dcb
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=f3420be7-d944-4751-b2a4-c9b8c8932efe
MICROSOFT_REDIRECT_URI=http://127.0.0.1/api/auth/oidc/callback
MICROSOFT_POST_LOGOUT_REDIRECT_URI=http://127.0.0.1/api/auth/oidc/logout/callback
```

Do not use `http://localhost:4000/auth/microsoft/callback`; that path is not exposed by this application.

## How to Run

```bash
pnpm --filter @smartboard/svc-auth dev
```

## Role in Big Picture

The authoritative source for user identity and session lifecycle. Only the Gateway calls this service. Never exposed publicly.

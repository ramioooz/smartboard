# @smartboard/web

Next.js App Router front-end for the smartboard platform.

## Responsibilities
- Authentication UI (Microsoft OIDC + DEV bypass login)
- Tenant switcher + theme/scheme picker
- Dataset upload and status tracking
- Dashboard builder (react-grid-layout)
- Chart rendering (ECharts canvas)
- Real-time dataset-ready notifications via SSE
- Settings page (theme + scheme persisted via /me/preferences)

## Port
`3000`

## Key Pages
| Route | Description |
|---|---|
| `/login` | Microsoft OIDC + DEV login |
| `/datasets` | Upload CSV, trigger ingest, view status |
| `/dashboards` | List + create dashboards |
| `/dashboards/:id` | Dashboard builder |
| `/settings` | Theme, scheme, preferences |

## Environment Variables
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_GATEWAY_URL` | `http://localhost:4000` | Gateway base URL |
| `NEXT_PUBLIC_DEV_BYPASS_AUTH` | `true` | Show DEV login button |

## How to Run
```bash
# Docker (Phase 2+)
docker compose -f infra/compose.yaml up smartboard-web

# Local dev
pnpm --filter @smartboard/web dev
```

## Role in Big Picture
The web app is the single user-facing surface. It talks exclusively to the Gateway (never directly to backend services). TanStack React Query manages server state; SSE from svc-realtime triggers cache invalidation after dataset ingestion.

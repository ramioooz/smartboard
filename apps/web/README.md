# @smartboard/web

Next.js App Router front-end for the smartboard platform.

## Responsibilities
- Browser session bootstrap and sign-out UX
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
| `/` | Overview and tenant-aware app shell |
| `/datasets` | Upload CSV, trigger ingest, view status |
| `/dashboards` | List + create dashboards |
| `/dashboards/:id` | Dashboard builder |
| `/settings` | Theme, scheme, preferences |

## Environment Variables
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_GATEWAY_URL` | `http://localhost:4000` | Gateway base URL |

## How to Run
```bash
# Docker (Phase 2+)
docker compose -f infra/compose.yaml up smartboard-web

# Local dev
pnpm --filter @smartboard/web dev
```

## Role in Big Picture
The web app is the single user-facing surface. It talks exclusively to the Gateway (never directly to backend services). Browser auth is cookie-based; API tooling can still use bearer tokens. TanStack React Query manages server state; SSE from svc-realtime triggers cache invalidation after dataset ingestion.

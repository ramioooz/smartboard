#!/usr/bin/env bash
# Run Prisma migrations for all services.
# Usage: ./infra/scripts/db-migrate.sh
set -euo pipefail

SERVICES=(svc-auth svc-tenants svc-datasets svc-analytics svc-dashboards)

for svc in "${SERVICES[@]}"; do
  echo "==> Migrating $svc..."
  pnpm --filter "@smartboard/$svc" run db:migrate
done

echo "All migrations complete."

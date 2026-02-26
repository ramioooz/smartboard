-- Smartboard — Postgres schema initialization
-- Each service gets its own schema for isolation.
-- Prisma migrations run within the appropriate schema per service.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS tenants;
CREATE SCHEMA IF NOT EXISTS datasets;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS dashboards;

COMMENT ON SCHEMA auth IS 'svc-auth: users, sessions, refresh tokens';
COMMENT ON SCHEMA tenants IS 'svc-tenants: workspaces, memberships, invites';
COMMENT ON SCHEMA datasets IS 'svc-datasets: dataset metadata, upload state';
COMMENT ON SCHEMA analytics IS 'svc-analytics: aggregated metrics, timeseries';
COMMENT ON SCHEMA dashboards IS 'svc-dashboards: dashboards, panels, layouts';

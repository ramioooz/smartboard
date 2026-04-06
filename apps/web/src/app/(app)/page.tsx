'use client';

import Link from 'next/link';
import { Card, CardContent, Badge } from '@smartboard/ui';
import { useUser } from '../../hooks/useUser';
import { useDatasets } from '../../hooks/useDatasets';
import { useDashboards } from '../../hooks/useDashboards';

export default function OverviewPage() {
  const { data: user, isLoading } = useUser();
  const { data: datasetsData, isLoading: isDatasetsLoading } = useDatasets();
  const { data: dashboards, isLoading: isDashboardsLoading } = useDashboards();

  const prefs = user?.preferences as
    | { theme?: string; scheme?: string; language?: string }
    | undefined;
  const datasetCount = datasetsData?.items.length ?? 0;
  const readyDatasetCount =
    datasetsData?.items.filter((dataset) => dataset.status === 'ready').length ?? 0;
  const dashboardCount = dashboards?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">
          {isLoading ? 'Loading…' : `Welcome back, ${user?.name ?? user?.email ?? 'there'}`}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Multi-tenant analytics and dashboard platform
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/datasets" className="block h-full">
          <Card className="h-full transition hover:border-[var(--accent)] hover:shadow-sm">
            <CardContent className="flex h-full flex-col justify-between pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Datasets
              </p>
              <p className="mt-2 text-3xl font-bold text-[var(--text)]">
                {isDatasetsLoading ? '—' : datasetCount}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {isDatasetsLoading
                  ? 'Loading datasets'
                  : `${readyDatasetCount} ready for dashboards`}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboards" className="block h-full">
          <Card className="h-full transition hover:border-[var(--accent)] hover:shadow-sm">
            <CardContent className="flex h-full flex-col justify-between pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Dashboards
              </p>
              <p className="mt-2 text-3xl font-bold text-[var(--text)]">
                {isDashboardsLoading ? '—' : dashboardCount}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {isDashboardsLoading
                  ? 'Loading dashboards'
                  : `${dashboardCount === 1 ? '1 dashboard' : `${dashboardCount} dashboards`} configured`}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings" className="block h-full">
          <Card className="h-full transition hover:border-[var(--accent)] hover:shadow-sm">
            <CardContent className="flex h-full flex-col justify-between pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                Active theme
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="success">{prefs?.theme ?? 'light'}</Badge>
                <Badge>{prefs?.scheme ?? 'mint'}</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Card, CardContent, Badge } from '@smartboard/ui';
import { useUser } from '../../hooks/useUser';
import { useDatasets } from '../../hooks/useDatasets';
import { useDashboards } from '../../hooks/useDashboards';
import { useLocale } from '../../i18n/use-t';

export default function OverviewPage() {
  const { data: user, isLoading } = useUser();
  const { data: datasetsData, isLoading: isDatasetsLoading } = useDatasets();
  const { data: dashboards, isLoading: isDashboardsLoading } = useDashboards();
  const { t, formatNumber } = useLocale();

  const prefs = user?.preferences as
    | { theme?: string; scheme?: string; language?: string }
    | undefined;
  const datasetCount = datasetsData?.items.length ?? 0;
  const readyDatasetCount =
    datasetsData?.items.filter((dataset) => dataset.status === 'ready').length ?? 0;
  const dashboardCount = dashboards?.length ?? 0;
  const themeLabel =
    prefs?.theme === 'dark' ? t('overview.themeDark') : t('overview.themeLight');
  const schemeLabel =
    prefs?.scheme === 'warm'
      ? t('overview.schemeWarm')
      : prefs?.scheme === 'neon'
        ? t('overview.schemeNeon')
        : prefs?.scheme === 'ember'
          ? t('overview.schemeEmber')
          : t('overview.schemeMint');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">
          {isLoading ? t('common.loading') : t('overview.welcomeBack', { name: user?.name ?? user?.email ?? 'there' })}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {t('overview.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/datasets" className="block h-full">
          <Card className="h-full transition hover:border-[var(--accent)] hover:shadow-sm">
            <CardContent className="flex h-full flex-col justify-between pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                {t('overview.datasetsTitle')}
              </p>
              <p className="mt-2 text-3xl font-bold text-[var(--text)]">
                {isDatasetsLoading ? '—' : formatNumber(datasetCount)}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {isDatasetsLoading
                  ? t('overview.loadingDatasets')
                  : t('overview.datasetsReady', { count: formatNumber(readyDatasetCount) })}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboards" className="block h-full">
          <Card className="h-full transition hover:border-[var(--accent)] hover:shadow-sm">
            <CardContent className="flex h-full flex-col justify-between pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                {t('overview.dashboardsTitle')}
              </p>
              <p className="mt-2 text-3xl font-bold text-[var(--text)]">
                {isDashboardsLoading ? '—' : formatNumber(dashboardCount)}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {isDashboardsLoading
                  ? t('overview.loadingDashboards')
                  : t(
                      dashboardCount === 1
                        ? 'overview.dashboardsConfigured_one'
                        : 'overview.dashboardsConfigured_other',
                      { count: formatNumber(dashboardCount) },
                    )}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings" className="block h-full">
          <Card className="h-full transition hover:border-[var(--accent)] hover:shadow-sm">
            <CardContent className="flex h-full flex-col justify-between pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                {t('overview.activeThemeTitle')}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="success">{themeLabel}</Badge>
                <Badge>{schemeLabel}</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

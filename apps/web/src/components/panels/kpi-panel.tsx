import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTimeseries } from '@/lib/datasets';
import { useLocale } from '../../i18n/use-t';

interface KpiPanelProps {
  config: Record<string, unknown>;
  onSelectDataset?: () => void;
}

export function KpiPanel({ config, onSelectDataset }: KpiPanelProps) {
  const { t, formatNumber } = useLocale();
  const label = typeof config['label'] === 'string' ? config['label'] : t('panels.metric');
  const unit = typeof config['unit'] === 'string' ? config['unit'] : '';
  const datasetId = typeof config['datasetId'] === 'string' ? config['datasetId'] : '';
  const metric = typeof config['metric'] === 'string' ? config['metric'] : 'value';
  const bucket = typeof config['bucket'] === 'string' ? config['bucket'] : 'hour';
  const aggregation = typeof config['aggregation'] === 'string' ? config['aggregation'] : 'latest';

  const { from, to } = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 3_600_000);
    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  }, []);

  const { data: rows, isLoading } = useQuery({
    queryKey: ['kpi', datasetId, metric, bucket, aggregation, from, to],
    queryFn: () => fetchTimeseries({ datasetId, metric, from, to, bucket }),
    enabled: !!datasetId,
    staleTime: 30_000,
  });

  const value = useMemo(() => {
    if (!datasetId) return '—';
    if (!rows || rows.length === 0) return '—';

    switch (aggregation) {
      case 'avg':
        return formatNumber(Math.round(rows.reduce((sum, row) => sum + row.avg, 0) / rows.length));
      case 'max':
        return formatNumber(Math.round(Math.max(...rows.map((row) => row.max))));
      case 'min':
        return formatNumber(Math.round(Math.min(...rows.map((row) => row.min))));
      case 'count':
        return formatNumber(rows.reduce((sum, row) => sum + row.count, 0));
      case 'latest':
      default:
        return formatNumber(Math.round(rows[rows.length - 1]?.avg ?? 0));
    }
  }, [aggregation, datasetId, formatNumber, rows]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1">
      <p className="text-4xl font-bold tabular-nums text-[var(--primary)]">
        {isLoading ? '…' : value}
        {unit && <span className="ml-1 text-xl font-normal text-[var(--muted)]">{unit}</span>}
      </p>
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      {!datasetId && (
        <button
          type="button"
          onClick={onSelectDataset}
          className="text-xs text-[var(--muted)] underline-offset-4 hover:text-[var(--primary)] hover:underline"
        >
          {t('panels.selectDataset')}
        </button>
      )}
    </div>
  );
}

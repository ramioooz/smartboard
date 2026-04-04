import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTimeseries } from '@/lib/datasets';

interface TablePanelProps {
  config: Record<string, unknown>;
  onSelectDataset?: () => void;
}

export function TablePanel({ config, onSelectDataset }: TablePanelProps) {
  const datasetId = typeof config['datasetId'] === 'string' ? config['datasetId'] : '';
  const metric = typeof config['metric'] === 'string' ? config['metric'] : 'value';
  const bucket = typeof config['bucket'] === 'string' ? config['bucket'] : 'hour';

  const columns = ['Bucket', 'Avg', 'Min', 'Max', 'Count'];
  const { from, to } = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 3_600_000);
    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  }, []);
  const { data: rows, isLoading } = useQuery({
    queryKey: ['table', datasetId, metric, bucket, from, to],
    queryFn: () => fetchTimeseries({ datasetId, metric, from, to, bucket }),
    enabled: !!datasetId,
    staleTime: 30_000,
  });

  return (
    <div className="h-full overflow-auto">
      {!datasetId && (
        <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
          <button
            type="button"
            onClick={onSelectDataset}
            className="underline-offset-4 hover:text-[var(--primary)] hover:underline"
          >
            Select a dataset
          </button>
        </div>
      )}
      {datasetId && isLoading && (
        <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
          Loading rows…
        </div>
      )}
      {datasetId && !isLoading && (
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {columns.map((col) => (
              <th
                key={col}
                className="pb-1.5 pr-4 text-left font-semibold text-[var(--muted)] first:pl-0"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((row, ri) => (
            <tr key={ri} className="border-b border-[var(--border)]/50 last:border-0">
              <td className="py-1.5 pr-4 text-[var(--text)] first:pl-0">
                {new Date(row.bucket).toLocaleString()}
              </td>
              <td className="py-1.5 pr-4 text-[var(--text)]">{Math.round(row.avg)}</td>
              <td className="py-1.5 pr-4 text-[var(--text)]">{Math.round(row.min)}</td>
              <td className="py-1.5 pr-4 text-[var(--text)]">{Math.round(row.max)}</td>
              <td className="py-1.5 pr-4 text-[var(--text)]">{row.count}</td>
            </tr>
          ))}
          {rows?.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-4 text-center text-[var(--muted)]">
                No rows returned for this dataset
              </td>
            </tr>
          )}
        </tbody>
      </table>
      )}
    </div>
  );
}

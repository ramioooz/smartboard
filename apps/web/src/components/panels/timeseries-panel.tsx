'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTimeseries } from '@/lib/datasets';
import { useLocale } from '../../i18n/use-t';

interface TimeseriesPanelProps {
  config: Record<string, unknown>;
  onSelectDataset?: () => void;
}

export function TimeseriesPanel({ config, onSelectDataset }: TimeseriesPanelProps) {
  const { t, formatNumber, formatTime } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<unknown>(null);

  const metric = typeof config['metric'] === 'string' ? config['metric'] : 'value';
  const datasetId = typeof config['datasetId'] === 'string' ? config['datasetId'] : '';
  const bucket = typeof config['bucket'] === 'string' ? config['bucket'] : 'hour';

  // Default time range: last 90 days so freshly uploaded sample datasets
  // remain visible without requiring a separate date-range UI first.
  const { from, to } = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 3_600_000);
    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  }, []);

  const { data: realRows } = useQuery({
    queryKey: ['timeseries', datasetId, metric, from, to, bucket],
    queryFn: () => fetchTimeseries({ datasetId, metric, from, to, bucket }),
    enabled: !!datasetId,
    staleTime: 30_000,
  });

  const chartData = useMemo(
    () => (datasetId && realRows ? realRows.map((r) => ({ bucket: r.bucket, value: r.avg })) : []),
    [datasetId, realRows],
  );
  const timeLabels = useMemo(
    () =>
      chartData.map((d) =>
        formatTime(d.bucket, {
          hour: 'numeric',
        }),
      ),
    [chartData, formatTime],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    void import('echarts').then((echarts) => {
      if (disposed || !containerRef.current) return;

      const chart = echarts.init(containerRef.current, undefined, { renderer: 'canvas' });
      chartRef.current = chart;

      const primary =
        getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() ||
        '#16a34a';
      const text =
        getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#111827';
      const muted =
        getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#6b7280';
      const border =
        getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#d1d5db';

      chart.setOption({
        backgroundColor: 'transparent',
        grid: { top: 8, right: 8, bottom: 24, left: 40 },
        graphic:
          chartData.length === 0
            ? {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: datasetId ? t('panels.noTimeseries') : t('panels.selectDataset'),
                  fill: muted,
                  fontSize: 12,
                },
              }
            : undefined,
        xAxis: {
          type: 'category',
          data: timeLabels,
          axisLine: { lineStyle: { color: border } },
          axisLabel: { color: muted, fontSize: 10 },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: muted, fontSize: 10 },
          splitLine: { lineStyle: { color: border, type: 'dashed' } },
        },
        series: [
          {
            name: metric,
            type: 'line',
            data: chartData.map((d) => d.value),
            smooth: true,
            symbol: 'none',
            lineStyle: { color: primary, width: 2 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: primary + '33' },
                  { offset: 1, color: primary + '00' },
                ],
              },
            },
          },
        ],
        tooltip: {
          trigger: 'axis',
          backgroundColor:
            getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() ||
            '#ffffff',
          borderColor: border,
          textStyle: { color: text, fontSize: 11 },
          valueFormatter: (value: unknown) =>
            typeof value === 'number' ? formatNumber(value) : String(value ?? ''),
        },
      });

      const ro = new ResizeObserver(() => {
        chart.resize();
      });
      if (containerRef.current) ro.observe(containerRef.current);

      return () => {
        ro.disconnect();
      };
    });

    return () => {
      disposed = true;
      if (chartRef.current) {
        (chartRef.current as { dispose: () => void }).dispose();
        chartRef.current = null;
      }
    };
  }, [chartData, datasetId, formatNumber, metric, t, timeLabels]); // chart is recreated when structure changes

  // Update chart data without recreating it
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current as { setOption: (opt: unknown) => void };
    const muted =
      getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#6b7280';
    chart.setOption({
      graphic:
        chartData.length === 0
          ? {
              type: 'text',
              left: 'center',
              top: 'middle',
              style: {
                text: datasetId ? t('panels.noTimeseries') : t('panels.selectDataset'),
                fill: muted,
                fontSize: 12,
              },
            }
          : undefined,
      xAxis: { data: timeLabels },
      series: [{ data: chartData.map((d) => d.value) }],
    });
  }, [chartData, datasetId, t, timeLabels]);

  if (!datasetId) {
    return (
      <div className="flex h-full items-center justify-center">
        <button
          type="button"
          onClick={onSelectDataset}
          className="text-sm font-medium text-[var(--muted)] underline-offset-4 hover:text-[var(--primary)] hover:underline"
        >
          {t('panels.selectDataset')}
        </button>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}

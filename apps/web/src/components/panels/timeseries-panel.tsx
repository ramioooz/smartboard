'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTimeseries } from '@/lib/datasets';

interface TimeseriesPanelProps {
  config: Record<string, unknown>;
}

// Stub data — shown when no datasetId is configured
function makeStubData() {
  const now = Date.now();
  return Array.from({ length: 24 }, (_, i) => ({
    bucket: new Date(now - (23 - i) * 3_600_000).toISOString(),
    avg: Math.round(40 + Math.random() * 60),
  }));
}

export function TimeseriesPanel({ config }: TimeseriesPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<unknown>(null);
  const [stubData] = useState(makeStubData);

  const metric    = typeof config['metric']    === 'string' ? config['metric']    : 'value';
  const datasetId = typeof config['datasetId'] === 'string' ? config['datasetId'] : '';
  const bucket    = typeof config['bucket']    === 'string' ? config['bucket']    : 'hour';

  // Default time range: last 24 hours
  const to   = new Date().toISOString();
  const from = new Date(Date.now() - 24 * 3_600_000).toISOString();

  const { data: realRows } = useQuery({
    queryKey: ['timeseries', datasetId, metric, from, to, bucket],
    queryFn: () => fetchTimeseries({ datasetId, metric, from, to, bucket }),
    enabled: !!datasetId,
    staleTime: 30_000,
  });

  const chartData = datasetId && realRows
    ? realRows.map((r) => ({ bucket: r.bucket, value: r.avg }))
    : stubData.map((r) => ({ bucket: r.bucket, value: r.avg }));

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    void import('echarts').then((echarts) => {
      if (disposed || !containerRef.current) return;

      const chart = echarts.init(containerRef.current, undefined, { renderer: 'canvas' });
      chartRef.current = chart;

      const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#16a34a';

      chart.setOption({
        backgroundColor: 'transparent',
        grid: { top: 8, right: 8, bottom: 24, left: 40 },
        xAxis: {
          type: 'category',
          data: chartData.map((d) => {
            const date = new Date(d.bucket);
            return `${date.getHours()}:00`;
          }),
          axisLine: { lineStyle: { color: 'var(--border)' } },
          axisLabel: { color: 'var(--muted)', fontSize: 10 },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: 'var(--muted)', fontSize: 10 },
          splitLine: { lineStyle: { color: 'var(--border)', type: 'dashed' } },
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
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
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
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          textStyle: { color: 'var(--text)', fontSize: 11 },
        },
      });

      const ro = new ResizeObserver(() => { chart.resize(); });
      if (containerRef.current) ro.observe(containerRef.current);

      return () => { ro.disconnect(); };
    });

    return () => {
      disposed = true;
      if (chartRef.current) {
        (chartRef.current as { dispose: () => void }).dispose();
        chartRef.current = null;
      }
    };
  }, [metric]); // chart is recreated when metric changes

  // Update chart data without recreating it
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current as { setOption: (opt: unknown) => void };
    chart.setOption({
      xAxis: { data: chartData.map((d) => { const dt = new Date(d.bucket); return `${dt.getHours()}:00`; }) },
      series: [{ data: chartData.map((d) => d.value) }],
    });
  }, [chartData]);

  return <div ref={containerRef} className="h-full w-full" />;
}

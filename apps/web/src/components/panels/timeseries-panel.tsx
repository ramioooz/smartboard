'use client';

import { useEffect, useRef } from 'react';

interface TimeseriesPanelProps {
  config: Record<string, unknown>;
}

// Stub data for Phase 6 — replaced by real analytics data in Phase 7
function makeStubData() {
  const now = Date.now();
  return Array.from({ length: 24 }, (_, i) => [
    new Date(now - (23 - i) * 3_600_000).toISOString(),
    Math.round(40 + Math.random() * 60),
  ]);
}

export function TimeseriesPanel({ config }: TimeseriesPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<unknown>(null);

  const metric = typeof config['metric'] === 'string' ? config['metric'] : 'value';

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    void import('echarts').then((echarts) => {
      if (disposed || !containerRef.current) return;

      const chart = echarts.init(containerRef.current, undefined, { renderer: 'canvas' });
      chartRef.current = chart;

      const data = makeStubData();
      const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#16a34a';

      chart.setOption({
        backgroundColor: 'transparent',
        grid: { top: 8, right: 8, bottom: 24, left: 40 },
        xAxis: {
          type: 'category',
          data: data.map((d) => {
            const date = new Date(d[0] as string);
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
            data: data.map((d) => d[1]),
            smooth: true,
            symbol: 'none',
            lineStyle: { color: primary, width: 2 },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: primary + '33' }, { offset: 1, color: primary + '00' }] } },
          },
        ],
        tooltip: { trigger: 'axis', backgroundColor: 'var(--surface)', borderColor: 'var(--border)', textStyle: { color: 'var(--text)', fontSize: 11 } },
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
  }, [metric]); // metric is the only stable dep; echarts init runs once per mount

  return <div ref={containerRef} className="h-full w-full" />;
}

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { v4 as uuidv4 } from 'uuid';
import { Button, Badge } from '@smartboard/ui';
import { PanelWrapper } from '../../../../components/panels/panel-wrapper';
import { KpiPanel } from '../../../../components/panels/kpi-panel';
import { TimeseriesPanel } from '../../../../components/panels/timeseries-panel';
import { TablePanel } from '../../../../components/panels/table-panel';
import { TextPanel } from '../../../../components/panels/text-panel';
import { useDashboard, useSaveLayout } from '../../../../hooks/useDashboards';
import { useDatasetMetrics, useDatasets } from '../../../../hooks/useDatasets';
import type { Panel } from '../../../../lib/dashboards';
import type { Dataset } from '../../../../lib/datasets';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const PANEL_TYPES: { type: Panel['type']; label: string }[] = [
  { type: 'kpi', label: 'KPI Card' },
  { type: 'timeseries', label: 'Time Series' },
  { type: 'table', label: 'Table' },
  { type: 'text', label: 'Text' },
];

const DEFAULT_TEXT_PLACEHOLDER = 'Add your notes here…';

const DEFAULT_CONFIG: Record<Panel['type'], Record<string, unknown>> = {
  kpi: { label: 'Metric', unit: '', metric: 'value', bucket: 'hour', aggregation: 'latest' },
  timeseries: { metric: 'value', bucket: 'hour' },
  table: { metric: 'value', bucket: 'hour' },
  text: { content: '' },
};

const DESKTOP_COLS = 12;
const DEFAULT_PANEL_W = 4;
const DEFAULT_PANEL_H = 3;
const BREAKPOINT_COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 } as const;
type BreakpointName = keyof typeof BREAKPOINT_COLS;

function collides(a: Layout, b: Layout) {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

function findNextPanelLayout(panels: Panel[]): Layout {
  const placed = panels.map((panel) => ({ ...panel.layout, i: panel.id }));

  for (let y = 0; y < 10_000; y += 1) {
    for (let x = 0; x <= DESKTOP_COLS - DEFAULT_PANEL_W; x += 1) {
      const candidate: Layout = {
        i: '',
        x,
        y,
        w: DEFAULT_PANEL_W,
        h: DEFAULT_PANEL_H,
      };

      if (placed.every((panel) => !collides(candidate, panel))) {
        return candidate;
      }
    }
  }

  return { i: '', x: 0, y: Infinity, w: DEFAULT_PANEL_W, h: DEFAULT_PANEL_H };
}

function sortPanelsForResponsiveLayout(panels: Panel[]) {
  return [...panels].sort((a, b) => {
    if (a.layout.y !== b.layout.y) return a.layout.y - b.layout.y;
    if (a.layout.x !== b.layout.x) return a.layout.x - b.layout.x;
    return a.id.localeCompare(b.id);
  });
}

function responsivePanelWidth(panel: Panel, breakpoint: BreakpointName, cols: number) {
  if (breakpoint === 'xxs') {
    return cols;
  }

  if (breakpoint === 'xs') {
    return Math.min(4, cols);
  }

  if (breakpoint === 'sm') {
    return cols;
  }

  if (breakpoint === 'md') {
    return Math.min(Math.max(panel.layout.w, 5), cols);
  }

  return Math.min(panel.layout.w, cols);
}

function deriveResponsiveLayout(
  panels: Panel[],
  breakpoint: BreakpointName,
  cols: number,
): Layout[] {
  const ordered = sortPanelsForResponsiveLayout(panels);
  const layout: Layout[] = [];

  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  for (const panel of ordered) {
    const width = responsivePanelWidth(panel, breakpoint, cols);
    const height = panel.layout.h;

    if (cursorX + width > cols) {
      cursorX = 0;
      cursorY += rowHeight;
      rowHeight = 0;
    }

    layout.push({
      i: panel.id,
      x: cursorX,
      y: cursorY,
      w: width,
      h: height,
    });

    cursorX += width;
    rowHeight = Math.max(rowHeight, height);
  }

  return layout;
}

function PanelContent({
  panel,
  onSelectDataset,
}: {
  panel: Panel;
  onSelectDataset?: () => void;
}) {
  switch (panel.type) {
    case 'kpi': return <KpiPanel config={panel.config} onSelectDataset={onSelectDataset} />;
    case 'timeseries': return <TimeseriesPanel config={panel.config} onSelectDataset={onSelectDataset} />;
    case 'table': return <TablePanel config={panel.config} onSelectDataset={onSelectDataset} />;
    case 'text': return <TextPanel config={panel.config} />;
  }
}

function textValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function titleCaseMetric(metric: string) {
  return metric
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function inferMetricUnit(metric: string) {
  const normalized = metric.trim().toLowerCase();
  if (!normalized) return '';
  if (
    normalized.includes('revenue') ||
    normalized.includes('amount') ||
    normalized.includes('price') ||
    normalized.includes('cost')
  ) {
    return '$';
  }
  if (
    normalized.includes('rate') ||
    normalized.includes('ratio') ||
    normalized.includes('percent') ||
    normalized.endsWith('pct')
  ) {
    return '%';
  }
  return '';
}

const DEFAULT_KPI_LABEL = textValue(DEFAULT_CONFIG.kpi['label'], 'Metric');

function PanelSettingsModal({
  panel,
  datasets,
  onClose,
  onSave,
}: {
  panel: Panel;
  datasets: Dataset[];
  onClose: () => void;
  onSave: (panel: Panel) => void;
}) {
  const [title, setTitle] = useState(panel.title);
  const [datasetId, setDatasetId] = useState(panel.datasetId ?? textValue(panel.config['datasetId']));
  const [metric, setMetric] = useState(textValue(panel.config['metric'], 'value'));
  const [bucket, setBucket] = useState(textValue(panel.config['bucket'], 'hour'));
  const [label, setLabel] = useState(textValue(panel.config['label'], panel.title));
  const [unit, setUnit] = useState(textValue(panel.config['unit']));
  const [aggregation, setAggregation] = useState(textValue(panel.config['aggregation'], 'latest'));
  const [content, setContent] = useState(() => {
    const initialContent = textValue(panel.config['content'], '');
    return initialContent === DEFAULT_TEXT_PLACEHOLDER ? '' : initialContent;
  });
  const initialAutoLabel = useMemo(
    () => (metric ? titleCaseMetric(metric) : panel.title),
    [metric, panel.title],
  );
  const [labelTouched, setLabelTouched] = useState(() => {
    const configuredLabel = textValue(panel.config['label'], panel.title).trim();
    if (!configuredLabel) return false;
    return (
      configuredLabel !== panel.title &&
      configuredLabel !== initialAutoLabel &&
      configuredLabel !== DEFAULT_KPI_LABEL
    );
  });
  const [unitTouched, setUnitTouched] = useState(textValue(panel.config['unit']).trim().length > 0);
  const readyDatasets = datasets.filter((dataset) => dataset.status === 'ready');
  const { data: metricOptions = [] } = useDatasetMetrics(datasetId || null);
  const previousAutoLabelRef = useRef(initialAutoLabel);

  useEffect(() => {
    if (panel.type !== 'kpi') return;

    const nextAutoLabel = metric ? titleCaseMetric(metric) : panel.title;
    previousAutoLabelRef.current = nextAutoLabel;

    if (
      !labelTouched &&
      (label === panel.title || label === DEFAULT_KPI_LABEL || label !== nextAutoLabel)
    ) {
      setLabel(nextAutoLabel);
    }

    if (!unitTouched) {
      const nextUnit = inferMetricUnit(metric);
      if (unit !== nextUnit) {
        setUnit(nextUnit);
      }
    }
  }, [panel.type, panel.title, metric, label, labelTouched, unit, unitTouched]);

  function applyMetricSelection(nextMetric: string) {
    setMetric(nextMetric);
    if (panel.type === 'kpi') {
      const nextAutoLabel = nextMetric ? titleCaseMetric(nextMetric) : panel.title;
      if (
        !labelTouched ||
        label === previousAutoLabelRef.current ||
        label === panel.title ||
        label === DEFAULT_KPI_LABEL
      ) {
        setLabel(nextAutoLabel);
        setLabelTouched(false);
      }
      if (!unitTouched) {
        setUnit(inferMetricUnit(nextMetric));
      }
      previousAutoLabelRef.current = nextAutoLabel;
    }
  }

  useEffect(() => {
    if (panel.type === 'text' || !datasetId || metricOptions.length === 0) return;
    if (metricOptions.includes(metric)) return;
    const fallbackMetric = metricOptions[0];
    if (fallbackMetric) {
      applyMetricSelection(fallbackMetric);
    }
  }, [datasetId, metric, metricOptions, panel.type]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextConfig = { ...panel.config };
    const normalizedDatasetId = datasetId || undefined;

    if (panel.type === 'text') {
      nextConfig['content'] = content;
    } else {
      nextConfig['metric'] = metric || 'value';
      nextConfig['bucket'] = bucket;

      if (normalizedDatasetId) nextConfig['datasetId'] = normalizedDatasetId;
      else delete nextConfig['datasetId'];
    }

    if (panel.type === 'kpi') {
      nextConfig['label'] = label || title;
      nextConfig['unit'] = unit;
      nextConfig['aggregation'] = aggregation;
    }

    onSave({
      ...panel,
      title: title.trim() || panel.title,
      datasetId: normalizedDatasetId,
      config: nextConfig,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text)]">Edit Panel</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text)]">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {panel.type !== 'text' && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">Dataset</label>
                <select
                  value={datasetId}
                  onChange={(e) => {
                    const nextDatasetId = e.target.value;
                    setDatasetId(nextDatasetId);
                    if (!nextDatasetId) {
                      applyMetricSelection('');
                    }
                  }}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">Select dataset</option>
                  {readyDatasets.map((dataset) => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">Metric</label>
                  <select
                    value={metric}
                    onChange={(e) => applyMetricSelection(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                    disabled={!datasetId}
                  >
                    <option value="">{datasetId ? 'Select metric' : 'Select dataset first'}</option>
                    {metricOptions.map((metricName) => (
                      <option key={metricName} value={metricName}>
                        {metricName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">Bucket</label>
                  <select
                    value={bucket}
                    onChange={(e) => setBucket(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    {['hour', 'day', 'week', 'month'].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {panel.type === 'kpi' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">Label</label>
                  <input
                    value={label}
                    onChange={(e) => {
                      setLabelTouched(true);
                      setLabel(e.target.value);
                    }}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text)]">Unit</label>
                  <input
                    value={unit}
                    onChange={(e) => {
                      setUnitTouched(true);
                      setUnit(e.target.value);
                    }}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text)]">Aggregation</label>
                <select
                  value={aggregation}
                  onChange={(e) => setAggregation(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="latest">Latest Average</option>
                  <option value="avg">Average</option>
                  <option value="max">Max</option>
                  <option value="min">Min</option>
                  <option value="count">Total Count</option>
                </select>
              </div>
            </>
          )}

          {panel.type === 'text' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text)]">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={DEFAULT_TEXT_PLACEHOLDER}
                rows={5}
                className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Apply
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardBuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data: dashboard, isLoading, error } = useDashboard(id);
  const saveLayout = useSaveLayout();
  const { data: datasetsData } = useDatasets();

  const [panels, setPanels] = useState<Panel[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const currentBreakpointRef = useRef<BreakpointName>('lg');
  const datasets = datasetsData?.items ?? [];

  // Use server panels on first load, local state after any edit
  const activePanels: Panel[] = panels ?? (dashboard?.panels ?? []);

  // Sync panels from server on initial load
  if (panels === null && dashboard && dashboard.panels.length > 0 && panels === null) {
    // handled by activePanels fallback above
  }

  const layouts: Record<BreakpointName, Layout[]> = {
    lg: activePanels.map((p) => ({ ...p.layout, i: p.id })),
    md: deriveResponsiveLayout(activePanels, 'md', BREAKPOINT_COLS.md),
    sm: deriveResponsiveLayout(activePanels, 'sm', BREAKPOINT_COLS.sm),
    xs: deriveResponsiveLayout(activePanels, 'xs', BREAKPOINT_COLS.xs),
    xxs: deriveResponsiveLayout(activePanels, 'xxs', BREAKPOINT_COLS.xxs),
  };
  const editingPanel = useMemo(
    () => activePanels.find((panel) => panel.id === editingPanelId) ?? null,
    [activePanels, editingPanelId],
  );

  const handleLayoutChange = useCallback(
    (currentLayout: Layout[]) => {
      if (currentBreakpointRef.current !== 'lg') return;
      if (panels === null && !dashboard) return;
      const base = panels ?? dashboard?.panels ?? [];
      const updated = base.map((p) => {
        const l = currentLayout.find((item) => item.i === p.id);
        if (!l) return p;
        return { ...p, layout: { i: p.id, x: l.x, y: l.y, w: l.w, h: l.h } };
      });
      setPanels(updated);
      setDirty(true);
    },
    [panels, dashboard],
  );

  function addPanel(type: Panel['type']) {
    const base = panels ?? dashboard?.panels ?? [];
    const layout = findNextPanelLayout(base);
    const newPanel: Panel = {
      id: uuidv4(),
      type,
      title: PANEL_TYPES.find((t) => t.type === type)?.label ?? type,
      config: DEFAULT_CONFIG[type],
      layout,
    };
    newPanel.layout.i = newPanel.id;
    setPanels([...base, newPanel]);
    setDirty(true);
    setShowAddMenu(false);
  }

  function deletePanel(panelId: string) {
    const base = panels ?? dashboard?.panels ?? [];
    setPanels(base.filter((p) => p.id !== panelId));
    setDirty(true);
  }

  function updatePanel(updatedPanel: Panel) {
    const base = panels ?? dashboard?.panels ?? [];
    setPanels(base.map((panel) => (panel.id === updatedPanel.id ? updatedPanel : panel)));
    setEditingPanelId(null);
    setDirty(true);
  }

  async function handleSave() {
    if (!id) return;
    setSaveStatus('saving');
    try {
      await saveLayout.mutateAsync({ id, panels: activePanels });
      setPanels(activePanels);
      setDirty(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }

  if (isLoading) {
    return (
      <div className="-m-6 flex h-full items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Loading dashboard…</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="-m-6 flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-500">Dashboard not found or unavailable.</p>
        <Button variant="ghost" onClick={() => router.push('/dashboards')}>← Back to Dashboards</Button>
      </div>
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      {/* Builder topbar */}
      <div className="flex flex-shrink-0 items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
        <button
          type="button"
          onClick={() => router.push('/dashboards')}
          className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Dashboards
        </button>

        <span className="text-[var(--border)]">/</span>
        <h1 className="font-semibold text-[var(--text)]">{dashboard.name}</h1>

        {dirty && <Badge variant="warning">Unsaved changes</Badge>}

        <div className="ml-auto flex items-center gap-2">
          {/* Add Panel dropdown */}
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowAddMenu((v) => !v)}>
              Add Panel
              <svg className="ml-1.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </Button>
            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-[calc(var(--radius)-2px)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
                  {PANEL_TYPES.map((pt) => (
                    <button
                      key={pt.type}
                      type="button"
                      onClick={() => addPanel(pt.type)}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--surface2)] transition-colors"
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Save button */}
          <Button size="sm" onClick={() => void handleSave()} disabled={!dirty || saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving…' : 'Save'}
          </Button>

          {saveStatus === 'saved' && <span className="text-xs text-[var(--primary)]">Saved!</span>}
          {saveStatus === 'error' && <span className="text-xs text-red-500">Error saving</span>}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-[var(--bg)] p-2">
        {activePanels.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="font-medium text-[var(--muted)]">Empty dashboard</p>
            <p className="text-sm text-[var(--muted)]">Click "Add Panel" to start building</p>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={BREAKPOINT_COLS}
            compactType="horizontal"
            rowHeight={80}
            margin={[12, 12]}
            draggableHandle=".drag-handle"
            draggableCancel=".panel-action"
            onBreakpointChange={(breakpoint) => {
              currentBreakpointRef.current = breakpoint as BreakpointName;
            }}
            onLayoutChange={handleLayoutChange}
          >
            {activePanels.map((panel) => (
              <PanelWrapper
                key={panel.id}
                title={panel.title}
                onEdit={() => setEditingPanelId(panel.id)}
                onDelete={() => deletePanel(panel.id)}
              >
                <PanelContent panel={panel} onSelectDataset={() => setEditingPanelId(panel.id)} />
              </PanelWrapper>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>
      {editingPanel && (
        <PanelSettingsModal
          panel={editingPanel}
          datasets={datasets}
          onClose={() => setEditingPanelId(null)}
          onSave={updatePanel}
        />
      )}
    </div>
  );
}

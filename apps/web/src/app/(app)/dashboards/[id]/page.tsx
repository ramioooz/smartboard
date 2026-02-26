'use client';

import { useState, useCallback } from 'react';
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
import type { Panel } from '../../../../lib/dashboards';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const PANEL_TYPES: { type: Panel['type']; label: string }[] = [
  { type: 'kpi', label: 'KPI Card' },
  { type: 'timeseries', label: 'Time Series' },
  { type: 'table', label: 'Table' },
  { type: 'text', label: 'Text' },
];

const DEFAULT_CONFIG: Record<Panel['type'], Record<string, unknown>> = {
  kpi: { label: 'Metric', value: '0', unit: '' },
  timeseries: { metric: 'value' },
  table: { columns: ['Metric', 'Value', 'Timestamp'], rows: [] },
  text: { content: 'Add your notes here…' },
};

function PanelContent({ panel }: { panel: Panel }) {
  switch (panel.type) {
    case 'kpi': return <KpiPanel config={panel.config} />;
    case 'timeseries': return <TimeseriesPanel config={panel.config} />;
    case 'table': return <TablePanel config={panel.config} />;
    case 'text': return <TextPanel config={panel.config} />;
  }
}

export default function DashboardBuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data: dashboard, isLoading, error } = useDashboard(id);
  const saveLayout = useSaveLayout();

  const [panels, setPanels] = useState<Panel[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Use server panels on first load, local state after any edit
  const activePanels: Panel[] = panels ?? (dashboard?.panels ?? []);

  // Sync panels from server on initial load
  if (panels === null && dashboard && dashboard.panels.length > 0 && panels === null) {
    // handled by activePanels fallback above
  }

  const layouts = {
    lg: activePanels.map((p) => ({ ...p.layout, i: p.id })),
  };

  const handleLayoutChange = useCallback(
    (currentLayout: Layout[]) => {
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
    const newPanel: Panel = {
      id: uuidv4(),
      type,
      title: PANEL_TYPES.find((t) => t.type === type)?.label ?? type,
      config: DEFAULT_CONFIG[type],
      layout: { i: '', x: 0, y: Infinity, w: 4, h: 3 },
    };
    newPanel.layout.i = newPanel.id;
    const base = panels ?? dashboard?.panels ?? [];
    setPanels([...base, newPanel]);
    setDirty(true);
    setShowAddMenu(false);
  }

  function deletePanel(panelId: string) {
    const base = panels ?? dashboard?.panels ?? [];
    setPanels(base.filter((p) => p.id !== panelId));
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
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={80}
            margin={[12, 12]}
            draggableHandle=".drag-handle"
            onLayoutChange={handleLayoutChange}
          >
            {activePanels.map((panel) => (
              <PanelWrapper
                key={panel.id}
                title={panel.title}
                onDelete={() => deletePanel(panel.id)}
              >
                <PanelContent panel={panel} />
              </PanelWrapper>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>
    </div>
  );
}

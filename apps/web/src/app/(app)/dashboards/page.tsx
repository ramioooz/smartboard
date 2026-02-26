'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button, Badge } from '@smartboard/ui';
import { useDashboards, useCreateDashboard } from '../../../hooks/useDashboards';
import type { Dashboard } from '../../../lib/dashboards';

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface2)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-medium text-[var(--text)]">No dashboards yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Create your first dashboard to start building</p>
        </div>
        <Button onClick={onNew}>New Dashboard</Button>
      </CardContent>
    </Card>
  );
}

function DashboardCard({ dashboard, onClick }: { dashboard: Dashboard; onClick: () => void }) {
  const panelCount = Array.isArray(dashboard.panels) ? dashboard.panels.length : 0;
  const updated = new Date(dashboard.updatedAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] transition-all duration-[var(--transition)] hover:border-[var(--primary)]/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--text)] group-hover:text-[var(--primary)]">
            {dashboard.name}
          </p>
          {dashboard.description && (
            <p className="mt-1 truncate text-sm text-[var(--muted)]">{dashboard.description}</p>
          )}
        </div>
        <Badge variant="default">{panelCount} {panelCount === 1 ? 'panel' : 'panels'}</Badge>
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">Updated {updated}</p>
    </button>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const create = useCreateDashboard();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const dashboard = await create.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
    onCreated(dashboard.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[var(--radius)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">New Dashboard</h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)]">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="My Dashboard"
              className="mt-1 w-full rounded-[calc(var(--radius)-4px)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)]">Description <span className="text-[var(--muted)]">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="What is this dashboard for?"
              rows={2}
              className="mt-1 w-full resize-none rounded-[calc(var(--radius)-4px)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || create.isPending}>
              {create.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardsPage() {
  const router = useRouter();
  const { data: dashboards, isLoading, error } = useDashboards();
  const [showCreate, setShowCreate] = useState(false);

  function handleCreated(id: string) {
    setShowCreate(false);
    router.push(`/dashboards/${id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Dashboards</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Build and share your analytics dashboards</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg className="mr-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Dashboard
        </Button>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-[var(--radius)] bg-[var(--surface2)]" />
          ))}
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-red-500">Failed to load dashboards. Is the gateway running?</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && dashboards && dashboards.length === 0 && (
        <EmptyState onNew={() => setShowCreate(true)} />
      )}

      {!isLoading && dashboards && dashboards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((d) => (
            <DashboardCard
              key={d.id}
              dashboard={d}
              onClick={() => router.push(`/dashboards/${d.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

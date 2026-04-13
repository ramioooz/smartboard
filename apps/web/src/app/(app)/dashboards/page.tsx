'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button, Badge } from '@smartboard/ui';
import {
  useCreateDashboard,
  useDashboards,
  useDeleteDashboard,
} from '../../../hooks/useDashboards';
import type { Dashboard } from '../../../lib/dashboards';
import { useLocale } from '../../../i18n/use-t';

function EmptyState({ onNew }: { onNew: () => void }) {
  const { t } = useLocale();

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface2)]">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-medium text-[var(--text)]">{t('dashboards.noDashboards')}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{t('dashboards.noDashboardsSubtitle')}</p>
        </div>
        <Button onClick={onNew}>{t('dashboards.newDashboard')}</Button>
      </CardContent>
    </Card>
  );
}

function DashboardCard({
  dashboard,
  onClick,
  onDelete,
  isDeleting,
}: {
  dashboard: Dashboard;
  onClick: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const { t, formatDate, formatNumber } = useLocale();
  const panelCount = Array.isArray(dashboard.panels) ? dashboard.panels.length : 0;
  const updated = formatDate(dashboard.updatedAt, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="group relative rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 text-start shadow-[var(--shadow)] transition-all duration-[var(--transition)] hover:border-[var(--primary)]/50 hover:shadow-lg">
      <button
        type="button"
        onClick={onClick}
        className="absolute inset-0 z-0 rounded-[var(--radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        aria-label={dashboard.name}
      />
      <div className="pointer-events-none relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 pe-3">
          <p className="truncate font-semibold text-[var(--text)] group-hover:text-[var(--primary)]">
            {dashboard.name}
          </p>
          {dashboard.description && (
            <p className="mt-1 truncate text-sm text-[var(--muted)]">{dashboard.description}</p>
          )}
        </div>
        <Badge variant="default">
          {t(panelCount === 1 ? 'dashboards.panelCount_one' : 'dashboards.panelCount_other', {
            count: formatNumber(panelCount),
          })}
        </Badge>
      </div>
      <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
        <p className="text-xs text-[var(--muted)]">{t('dashboards.updated', { date: updated })}</p>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label={t('dashboards.deleteDashboardLabel', { name: dashboard.name })}
          className="rounded-[calc(var(--radius)-6px)] px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-50 dark:text-red-400"
        >
          {isDeleting ? t('common.deleting') : t('dashboards.deleteDashboard')}
        </button>
      </div>
    </article>
  );
}

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const create = useCreateDashboard();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const dashboard = await create.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
    });
    onCreated(dashboard.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[var(--radius)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">{t('dashboards.createTitle')}</h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)]">
              {t('dashboards.createName')}
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder={t('dashboards.createNamePlaceholder')}
              className="mt-1 w-full rounded-[calc(var(--radius)-4px)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text)]">
              {t('dashboards.createDescription')}{' '}
              <span className="text-[var(--muted)]">{t('dashboards.optional')}</span>
            </label>
            <textarea
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder={t('dashboards.createDescriptionPlaceholder')}
              rows={2}
              className="mt-1 w-full resize-none rounded-[calc(var(--radius)-4px)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim() || create.isPending}>
              {create.isPending ? t('common.creating') : t('dashboards.createButton')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardsPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { data: dashboards, isLoading, error } = useDashboards();
  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteDashboard = useDeleteDashboard();

  function handleCreated(id: string) {
    setShowCreate(false);
    router.push(`/dashboards/${id}`);
  }

  async function handleDelete(dashboard: Dashboard) {
    if (!window.confirm(t('dashboards.deleteConfirm', { name: dashboard.name }))) return;

    setDeletingId(dashboard.id);
    try {
      await deleteDashboard.mutateAsync(dashboard.id);
    } catch {
      window.alert(t('dashboards.deleteError'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">{t('dashboards.title')}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t('dashboards.subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg
            className="me-2"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('dashboards.newDashboard')}
        </Button>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 animate-pulse rounded-[var(--radius)] bg-[var(--surface2)]"
            />
          ))}
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-red-500">{t('dashboards.createFailed')}</p>
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
              onDelete={() => void handleDelete(d)}
              isDeleting={deletingId === d.id}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}

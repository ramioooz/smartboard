'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardContent, CardHeader } from '@smartboard/ui';
import type { PagedResult } from '@smartboard/shared';
import { useUser } from '../../hooks/useUser';
import { clearTenantId, getTenantId, setTenantId } from '../../lib/tenant';
import { createTenant, listTenants } from '../../lib/tenants';
import type { Tenant } from '../../lib/tenants';

function slugify(value: string): string {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  const fallback = base || 'workspace';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${fallback}-${suffix}`;
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <Card className="w-full max-w-md">
        <CardContent className="py-10 text-center">
          <p className="text-sm text-[var(--muted)]">{label}</p>
        </CardContent>
      </Card>
    </div>
  );
}

interface TenantContextValue {
  tenants: Tenant[];
  currentTenant: Tenant;
  selectTenant: (tenantId: string) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

function clearTenantScopedQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.removeQueries({ queryKey: ['dashboards'] });
  qc.removeQueries({ queryKey: ['dashboard'] });
  qc.removeQueries({ queryKey: ['datasets'] });
  qc.removeQueries({ queryKey: ['dataset'] });
  qc.removeQueries({ queryKey: ['timeseries'] });
}

function OnboardingState({
  onCreate,
  isPending,
  error,
}: {
  onCreate: (name: string) => Promise<void>;
  isPending: boolean;
  error?: string;
}) {
  const [name, setName] = useState('My Workspace');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onCreate(trimmed);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <h1 className="text-lg font-semibold text-[var(--text)]">Create your first workspace</h1>
          <p className="text-sm text-[var(--muted)]">
            Smartboard needs a tenant before datasets and dashboards can load.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)]">Workspace name</label>
              <input
                autoFocus
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                className="mt-1 w-full rounded-[calc(var(--radius)-4px)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                placeholder="My Workspace"
              />
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <div className="flex justify-end">
              <Button type="submit" disabled={!name.trim() || isPending}>
                {isPending ? 'Creating…' : 'Create Workspace'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SelectionState({
  tenants,
  onSelect,
}: {
  tenants: Tenant[];
  onSelect: (tenantId: string) => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <h1 className="text-lg font-semibold text-[var(--text)]">Choose a workspace</h1>
          <p className="text-sm text-[var(--muted)]">
            Select the workspace you want to use for dashboards, datasets, and realtime updates.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              type="button"
              onClick={() => onSelect(tenant.id)}
              className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-colors hover:border-[var(--primary)] hover:bg-[var(--surface2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <p className="font-medium text-[var(--text)]">{tenant.name}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{tenant.slug}</p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenant must be used within TenantBootstrap');
  }
  return ctx;
}

export function TenantBootstrap({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { data: user, isLoading: isUserLoading, isError: isUserError } = useUser();
  const [selectionState, setSelectionState] = useState<'loading' | 'ready' | 'needs-selection'>('loading');
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);

  useEffect(() => {
    setSelectionState('loading');
    setActiveTenantId(getTenantId());
  }, [user?.id]);

  const tenantsQuery = useQuery({
    queryKey: ['tenants'],
    queryFn: listTenants,
    enabled: !!user,
    staleTime: 60_000,
  });

  const createTenantMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: (tenant) => {
      setTenantId(tenant.id);
      setActiveTenantId(tenant.id);
      clearTenantScopedQueries(qc);
      qc.setQueryData(['tenants'], (previous: PagedResult<Tenant> | undefined) => {
        if (!previous) {
          return { items: [tenant], total: 1, page: 1, limit: 50, hasMore: false };
        }
        return {
          ...previous,
          items: [tenant, ...previous.items.filter((item) => item.id !== tenant.id)],
          total: previous.total + 1,
        };
      });
      setSelectionState('ready');
    },
  });

  const tenants = tenantsQuery.data?.items ?? [];
  const validStoredTenant = useMemo(() => {
    if (!activeTenantId) return null;
    return tenants.find((tenant) => tenant.id === activeTenantId) ?? null;
  }, [activeTenantId, tenants]);
  const currentTenant = useMemo(() => {
    if (!activeTenantId) return null;
    return tenants.find((tenant) => tenant.id === activeTenantId) ?? null;
  }, [activeTenantId, tenants]);

  function selectTenant(tenantId: string) {
    if (activeTenantId === tenantId) {
      setSelectionState('ready');
      return;
    }
    setTenantId(tenantId);
    setActiveTenantId(tenantId);
    clearTenantScopedQueries(qc);
    setSelectionState('ready');
  }

  useEffect(() => {
    if (!user || tenantsQuery.isLoading) return;

    if (tenants.length === 0) {
      clearTenantId();
      setActiveTenantId(null);
      setSelectionState('ready');
      return;
    }

    if (validStoredTenant) {
      setSelectionState('ready');
      return;
    }

    if (tenants.length === 1) {
      const onlyTenant = tenants[0];
      if (!onlyTenant) return;
      setTenantId(onlyTenant.id);
      setActiveTenantId(onlyTenant.id);
      clearTenantScopedQueries(qc);
      setSelectionState('ready');
      return;
    }

    clearTenantId();
    setActiveTenantId(null);
    clearTenantScopedQueries(qc);
    setSelectionState('needs-selection');
  }, [user, tenantsQuery.isLoading, tenants.length, tenants, validStoredTenant, qc]);

  if (isUserLoading) {
    return <LoadingState label="Loading account…" />;
  }

  if (isUserError) {
    return <LoadingState label="Loading account failed." />;
  }

  if (tenantsQuery.isLoading || (selectionState === 'loading' && !!user)) {
    return <LoadingState label="Loading workspace…" />;
  }

  if (tenantsQuery.error) {
    return <LoadingState label="Loading workspace failed." />;
  }

  if (tenants.length === 0) {
    return (
      <OnboardingState
        isPending={createTenantMutation.isPending}
        error={createTenantMutation.error instanceof Error ? createTenantMutation.error.message : undefined}
        onCreate={async (name) => {
          await createTenantMutation.mutateAsync({
            name,
            slug: slugify(name),
          });
        }}
      />
    );
  }

  if (selectionState === 'needs-selection') {
    return <SelectionState tenants={tenants} onSelect={selectTenant} />;
  }

  if (!currentTenant) {
    return <LoadingState label="Loading workspace…" />;
  }

  return (
    <TenantContext.Provider
      value={{
        tenants,
        currentTenant,
        selectTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
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

function getValidStoredTenant(tenants: Tenant[]): Tenant | null {
  const storedId = getTenantId();
  if (!storedId) return null;
  return tenants.find((tenant) => tenant.id === storedId) ?? null;
}

export function TenantBootstrap({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { data: user, isLoading: isUserLoading } = useUser();
  const [selectionReady, setSelectionReady] = useState(false);

  useEffect(() => {
    setSelectionReady(false);
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
      setSelectionReady(true);
    },
  });

  const tenants = tenantsQuery.data?.items ?? [];
  const validStoredTenant = useMemo(() => getValidStoredTenant(tenants), [tenants]);

  useEffect(() => {
    if (!user || tenantsQuery.isLoading) return;

    if (tenants.length === 0) {
      clearTenantId();
      setSelectionReady(true);
      return;
    }

    if (validStoredTenant) {
      setSelectionReady(true);
      return;
    }

    const firstTenant = tenants[0];
    if (!firstTenant) return;

    // Phase 1 fallback: auto-select the first available tenant if there is no valid stored choice.
    setTenantId(firstTenant.id);
    setSelectionReady(true);
  }, [user, tenantsQuery.isLoading, tenants.length, tenants, validStoredTenant]);

  if (isUserLoading) {
    return <LoadingState label="Loading account…" />;
  }

  if (tenantsQuery.isLoading || (!selectionReady && !!user)) {
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

  return <>{children}</>;
}

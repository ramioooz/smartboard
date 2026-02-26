'use client';

import { Card, CardContent, Badge } from '@smartboard/ui';
import { useUser } from '../../hooks/useUser';

export default function OverviewPage() {
  const { data: user, isLoading } = useUser();

  const prefs = user?.preferences as
    | { theme?: string; scheme?: string; language?: string }
    | undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">
          {isLoading ? 'Loading…' : `Welcome back, ${user?.name ?? user?.email ?? 'there'}`}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Multi-tenant analytics and dashboard platform
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Datasets
            </p>
            <p className="mt-2 text-3xl font-bold text-[var(--text)]">—</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Available in Phase 7</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Dashboards
            </p>
            <p className="mt-2 text-3xl font-bold text-[var(--text)]">—</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Available in Phase 6</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Active theme
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="success">{prefs?.theme ?? 'light'}</Badge>
              <Badge>{prefs?.scheme ?? 'mint'}</Badge>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Change in{' '}
              <a href="/settings" className="text-[var(--primary)] hover:underline">
                Settings
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

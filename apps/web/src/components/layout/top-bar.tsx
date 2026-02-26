'use client';

import { useUser } from '../../hooks/useUser';
import { useScheme } from '../../hooks/useScheme';

export function TopBar() {
  const { data: user } = useUser();

  // Sync data-scheme from user preferences on load
  useScheme(
    (user?.preferences as { scheme?: string } | undefined)?.scheme,
  );

  const initial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-end border-b border-[var(--border)] bg-[var(--surface)] px-6">
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="text-right">
              <p className="text-sm font-medium text-[var(--text)]">{user.name ?? user.email}</p>
              <p className="text-xs text-[var(--muted)]">{user.email}</p>
            </div>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-[var(--primaryFg)]">
              {initial}
            </div>
          </>
        ) : (
          <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--surface2)]" />
        )}
      </div>
    </header>
  );
}

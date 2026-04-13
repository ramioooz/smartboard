'use client';

import { useEffect, useRef, useState } from 'react';
import { startLogout } from '../../lib/auth';
import { useUser } from '../../hooks/useUser';
import { usePersistedAppearance } from '../../hooks/usePersistedAppearance';
import { useTenant } from './tenant-bootstrap';
import { useLocale } from '../../i18n/use-t';

export function TopBar() {
  const { data: user } = useUser();
  const { currentTenant, tenants, selectTenant } = useTenant();
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const preferences = user?.preferences as
    | { theme?: 'light' | 'dark'; scheme?: 'mint' | 'warm' | 'neon' | 'ember' }
    | undefined;

  usePersistedAppearance(preferences?.theme, preferences?.scheme);

  const initial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?';
  const hasMultipleTenants = tenants.length > 1;

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6">
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => hasMultipleTenants && setIsOpen((open) => !open)}
          className="flex min-w-[220px] items-center gap-3 rounded-[calc(var(--radius)-4px)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-start transition-colors hover:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-default disabled:hover:border-[var(--border)]"
          disabled={!hasMultipleTenants}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--surface2)] text-xs font-semibold text-[var(--text)]">
            {currentTenant.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--text)]">{currentTenant.name}</p>
            <p className="truncate text-xs text-[var(--muted)]">
              {hasMultipleTenants ? t('topbar.switchWorkspace') : currentTenant.slug}
            </p>
          </div>
          {hasMultipleTenants ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--muted)]"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          ) : null}
        </button>

        {isOpen ? (
          <div className="absolute start-0 top-[calc(100%+8px)] z-20 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow)]">
            {tenants.map((tenant) => {
              const isActive = tenant.id === currentTenant.id;
              return (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => {
                    selectTenant(tenant.id);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-[calc(var(--radius)-6px)] px-3 py-2 text-start hover:bg-[var(--surface2)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text)]">{tenant.name}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{tenant.slug}</p>
                  </div>
                  {isActive ? (
                    <span className="text-xs font-medium text-[var(--primary)]">
                      {t('common.current')}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <button
              type="button"
              onClick={() => startLogout(`${window.location.origin}/signed-out`)}
              className="rounded-[calc(var(--radius)-6px)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              {t('common.signOut')}
            </button>
            <div className="text-end">
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

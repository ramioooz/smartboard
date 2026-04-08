'use client';

import { startLogin } from '../../lib/auth';
import { useLocale } from '../../i18n/use-t';

export default function SignedOutPage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <div className="w-full max-w-lg rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <div className="border-b border-[var(--border)] px-6 py-5">
          <h1 className="text-lg font-semibold text-[var(--text)]">{t('signedOut.title')}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t('signedOut.subtitle')}
          </p>
        </div>
        <div className="flex justify-end px-6 py-4">
          <button
            type="button"
            onClick={() => startLogin(`${window.location.origin}/`)}
            className="inline-flex items-center rounded-[calc(var(--radius)-6px)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primaryFg)] transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            {t('common.signIn')}
          </button>
        </div>
      </div>
    </div>
  );
}

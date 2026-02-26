'use client';

import { clsx } from 'clsx';
import type { UserPreferences } from '../../lib/auth';

interface ThemeOption {
  theme: UserPreferences['theme'];
  scheme: UserPreferences['scheme'];
  label: string;
  // Preview colors (hardcoded to show what each theme looks like)
  preview: {
    bg: string;
    surface: string;
    primary: string;
    text: string;
  };
}

const THEMES: ThemeOption[] = [
  {
    theme: 'light',
    scheme: 'mint',
    label: 'Light · Mint',
    preview: { bg: '#f6f9f7', surface: '#ffffff', primary: '#16a34a', text: '#0f172a' },
  },
  {
    theme: 'light',
    scheme: 'warm',
    label: 'Light · Warm',
    preview: { bg: '#faf8f4', surface: '#ffffff', primary: '#f59e0b', text: '#1f2937' },
  },
  {
    theme: 'dark',
    scheme: 'neon',
    label: 'Dark · Neon',
    preview: { bg: '#0b0b0c', surface: '#111113', primary: '#a3ff12', text: '#f4f4f5' },
  },
  {
    theme: 'dark',
    scheme: 'ember',
    label: 'Dark · Ember',
    preview: { bg: '#0a0a0a', surface: '#121212', primary: '#f97316', text: '#f9fafb' },
  },
];

interface ThemePickerProps {
  value: { theme: UserPreferences['theme']; scheme: UserPreferences['scheme'] };
  onChange: (value: { theme: UserPreferences['theme']; scheme: UserPreferences['scheme'] }) => void;
}

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {THEMES.map((opt) => {
        const isSelected = opt.theme === value.theme && opt.scheme === value.scheme;
        return (
          <button
            key={`${opt.theme}-${opt.scheme}`}
            type="button"
            onClick={() => onChange({ theme: opt.theme, scheme: opt.scheme })}
            className={clsx(
              'group relative overflow-hidden rounded-[var(--radius)] border-2 transition-all duration-[var(--transition)]',
              'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
              isSelected
                ? 'border-[var(--primary)] shadow-[var(--shadow)]'
                : 'border-[var(--border)] hover:border-[var(--primary)]/50',
            )}
          >
            {/* Preview card */}
            <div
              className="h-20 w-full p-2.5"
              style={{ backgroundColor: opt.preview.bg }}
            >
              <div
                className="h-full w-full rounded-lg p-2"
                style={{ backgroundColor: opt.preview.surface }}
              >
                {/* Mini bar */}
                <div
                  className="mb-1.5 h-1.5 w-10 rounded-full"
                  style={{ backgroundColor: opt.preview.primary }}
                />
                <div
                  className="mb-1 h-1 w-14 rounded-full opacity-40"
                  style={{ backgroundColor: opt.preview.text }}
                />
                <div
                  className="h-1 w-10 rounded-full opacity-25"
                  style={{ backgroundColor: opt.preview.text }}
                />
              </div>
            </div>

            {/* Label */}
            <div className="bg-[var(--surface2)] px-2 py-1.5 text-center">
              <p className="text-xs font-medium text-[var(--text)]">{opt.label}</p>
            </div>

            {/* Selected checkmark */}
            {isSelected && (
              <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--primaryFg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

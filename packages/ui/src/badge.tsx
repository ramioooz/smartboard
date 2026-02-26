import { type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

const variants = {
  default: 'bg-[var(--surface2)] text-[var(--muted)]',
  success: 'bg-[var(--primary)] text-[var(--primaryFg)]',
  warning: 'bg-[var(--accent)] text-[var(--text)]',
  error: 'bg-red-500/15 text-red-600 dark:text-red-400',
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

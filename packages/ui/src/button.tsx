import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

const variants = {
  primary: 'bg-[var(--primary)] text-[var(--primaryFg)] hover:opacity-90',
  ghost: 'bg-transparent text-[var(--text)] hover:bg-[var(--surface2)]',
  outline:
    'border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-[var(--surface2)]',
} as const;

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center rounded-[var(--radius)] font-medium',
        'transition-[background-color,opacity] duration-[var(--transition)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'cursor-pointer',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

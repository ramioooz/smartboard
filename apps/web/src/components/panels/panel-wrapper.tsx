import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { useLocale } from '../../i18n/use-t';

interface PanelWrapperProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  onDelete: () => void;
  onEdit?: () => void;
  children: ReactNode;
}

/**
 * Wrapper rendered by react-grid-layout for each panel.
 * Must forward the ref and spread all unknown props so RGL can attach drag listeners.
 * The drag handle class `drag-handle` tells RGL which area initiates dragging.
 */
export const PanelWrapper = forwardRef<HTMLDivElement, PanelWrapperProps>(
  ({ title, onDelete, onEdit, children, style, className, ...rest }, ref) => {
    const { t } = useLocale();

    return (
      <div
        ref={ref}
        style={style}
        className={`flex flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] ${className ?? ''}`}
        {...rest}
      >
        {/* Drag handle / title bar */}
        <div className="drag-handle flex cursor-grab items-center justify-between border-b border-[var(--border)] px-3 py-2 active:cursor-grabbing">
          <p className="truncate text-xs font-semibold text-[var(--text)]">{title}</p>
          <div className="ms-2 flex flex-shrink-0 items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit();
                }}
                className="panel-action rounded p-0.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface2)] hover:text-[var(--text)] focus-visible:outline-none"
                aria-label={t('panels.editPanel')}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="panel-action rounded p-0.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface2)] hover:text-red-500 focus-visible:outline-none"
              aria-label={t('panels.deletePanel')}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-hidden p-3">{children}</div>
      </div>
    );
  },
);
PanelWrapper.displayName = 'PanelWrapper';

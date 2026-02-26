import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

interface PanelWrapperProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  onDelete: () => void;
  children: ReactNode;
}

/**
 * Wrapper rendered by react-grid-layout for each panel.
 * Must forward the ref and spread all unknown props so RGL can attach drag listeners.
 * The drag handle class `drag-handle` tells RGL which area initiates dragging.
 */
export const PanelWrapper = forwardRef<HTMLDivElement, PanelWrapperProps>(
  ({ title, onDelete, children, style, className, ...rest }, ref) => {
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
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="ml-2 flex-shrink-0 rounded p-0.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface2)] hover:text-red-500 focus-visible:outline-none"
            aria-label="Delete panel"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-hidden p-3">
          {children}
        </div>
      </div>
    );
  },
);
PanelWrapper.displayName = 'PanelWrapper';

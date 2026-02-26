interface KpiPanelProps {
  config: Record<string, unknown>;
}

export function KpiPanel({ config }: KpiPanelProps) {
  const value = config['value'] !== undefined ? String(config['value']) : '—';
  const label = typeof config['label'] === 'string' ? config['label'] : 'Metric';
  const unit = typeof config['unit'] === 'string' ? config['unit'] : '';

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1">
      <p className="text-4xl font-bold tabular-nums text-[var(--primary)]">
        {value}
        {unit && <span className="ml-1 text-xl font-normal text-[var(--muted)]">{unit}</span>}
      </p>
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
    </div>
  );
}

interface TablePanelProps {
  config: Record<string, unknown>;
}

// Stub table — Phase 7 will connect to real analytics data + virtualization
export function TablePanel({ config }: TablePanelProps) {
  const columns = Array.isArray(config['columns'])
    ? (config['columns'] as string[])
    : ['Metric', 'Value', 'Timestamp'];

  const rows = Array.isArray(config['rows'])
    ? (config['rows'] as unknown[][])
    : [
        ['revenue', '12,400', '2024-01-15'],
        ['users', '3,820', '2024-01-15'],
        ['sessions', '9,100', '2024-01-15'],
      ];

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {columns.map((col) => (
              <th
                key={col}
                className="pb-1.5 pr-4 text-left font-semibold text-[var(--muted)] first:pl-0"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-[var(--border)]/50 last:border-0">
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="py-1.5 pr-4 text-[var(--text)] first:pl-0"
                >
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

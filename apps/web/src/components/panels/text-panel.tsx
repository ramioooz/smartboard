interface TextPanelProps {
  config: Record<string, unknown>;
}

const TEXT_PANEL_PLACEHOLDER = 'Add your notes here…';

export function TextPanel({ config }: TextPanelProps) {
  const rawContent = typeof config['content'] === 'string' ? config['content'] : '';
  const content = rawContent.trim().length > 0 ? rawContent : TEXT_PANEL_PLACEHOLDER;
  const isPlaceholder = rawContent.trim().length === 0;

  return (
    <div className="h-full overflow-auto">
      <p
        className={`whitespace-pre-wrap text-sm leading-relaxed ${
          isPlaceholder ? 'text-[var(--muted)]' : 'text-[var(--text)]'
        }`}
      >
        {content}
      </p>
    </div>
  );
}

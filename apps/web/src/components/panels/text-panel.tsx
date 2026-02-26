interface TextPanelProps {
  config: Record<string, unknown>;
}

export function TextPanel({ config }: TextPanelProps) {
  const content =
    typeof config['content'] === 'string'
      ? config['content']
      : 'Double-click to edit. Supports plain text.';

  return (
    <div className="h-full overflow-auto">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">{content}</p>
    </div>
  );
}

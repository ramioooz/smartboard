import { useLocale } from '../../i18n/use-t';

interface TextPanelProps {
  config: Record<string, unknown>;
}

export function TextPanel({ config }: TextPanelProps) {
  const { t } = useLocale();
  const rawContent = typeof config['content'] === 'string' ? config['content'] : '';
  const placeholder = t('panels.addNotes');
  const content = rawContent.trim().length > 0 ? rawContent : placeholder;
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

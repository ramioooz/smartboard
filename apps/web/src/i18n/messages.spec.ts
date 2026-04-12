import ar from './messages/ar';
import en from './messages/en';
import fr from './messages/fr';

function collectKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    collectKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('i18n message dictionaries', () => {
  it.each([
    ['fr', fr],
    ['ar', ar],
  ])('%s has the same message keys as English', (_locale, messages) => {
    expect(collectKeys(messages).sort()).toEqual(collectKeys(en).sort());
  });
});

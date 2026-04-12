import { UserPreferencesSchema } from './index';

declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare const expect: {
  (actual: () => unknown): {
    not: {
      toThrow(): void;
    };
    toThrow(): void;
  };
};

describe('UserPreferencesSchema', () => {
  it('accepts supported language values', () => {
    expect(() =>
      UserPreferencesSchema.parse({
        theme: 'light',
        scheme: 'mint',
        language: 'fr',
      }),
    ).not.toThrow();
  });

  it('rejects unsupported language values', () => {
    expect(() =>
      UserPreferencesSchema.parse({
        theme: 'light',
        scheme: 'mint',
        language: 'de',
      }),
    ).toThrow();
  });
});

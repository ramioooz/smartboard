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
  for (const language of ['en', 'fr', 'ar']) {
    it(`accepts supported language value ${language}`, () => {
      expect(() =>
        UserPreferencesSchema.parse({
          theme: 'light',
          scheme: 'mint',
          language,
        }),
      ).not.toThrow();
    });
  }

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

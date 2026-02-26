import { DevLoginSchema, UserPreferencesSchema } from '@smartboard/shared';

describe('svc-auth — schema validation', () => {
  describe('DevLoginSchema', () => {
    it('accepts a valid email address', () => {
      const result = DevLoginSchema.safeParse({ email: 'developer@example.com' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.email).toBe('developer@example.com');
    });

    it('accepts work email format', () => {
      const result = DevLoginSchema.safeParse({ email: 'alice@smartboard.io' });
      expect(result.success).toBe(true);
    });

    it('rejects non-string email', () => {
      const result = DevLoginSchema.safeParse({ email: 123 });
      expect(result.success).toBe(false);
    });

    it('rejects clearly invalid email format', () => {
      const result = DevLoginSchema.safeParse({ email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('rejects email without domain', () => {
      const result = DevLoginSchema.safeParse({ email: 'user@' });
      expect(result.success).toBe(false);
    });
  });

  describe('UserPreferencesSchema', () => {
    it('accepts valid light/mint preferences', () => {
      const result = UserPreferencesSchema.safeParse({
        theme: 'light',
        scheme: 'mint',
        language: 'en',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid dark/neon preferences', () => {
      const result = UserPreferencesSchema.safeParse({
        theme: 'dark',
        scheme: 'neon',
        language: 'ar',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid theme', () => {
      const result = UserPreferencesSchema.safeParse({ theme: 'pink', scheme: 'mint', language: 'en' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid scheme', () => {
      const result = UserPreferencesSchema.safeParse({ theme: 'dark', scheme: 'ocean', language: 'en' });
      expect(result.success).toBe(false);
    });

    it('accepts all valid scheme values', () => {
      const schemes = ['mint', 'warm', 'neon', 'ember'];
      for (const scheme of schemes) {
        const result = UserPreferencesSchema.safeParse({ theme: 'light', scheme, language: 'en' });
        expect(result.success).toBe(true);
      }
    });

    it('defaults to light theme and mint scheme when fields omitted', () => {
      const result = UserPreferencesSchema.safeParse({ language: 'en' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.theme).toBe('light');
        expect(result.data.scheme).toBe('mint');
      }
    });
  });
});

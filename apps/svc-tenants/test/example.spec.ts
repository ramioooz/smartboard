import { CreateTenantSchema, InviteMemberSchema } from '@smartboard/shared';

describe('svc-tenants — schema validation', () => {
  describe('CreateTenantSchema', () => {
    it('accepts valid tenant with name and slug', () => {
      const result = CreateTenantSchema.safeParse({ name: 'Acme Corp', slug: 'acme-corp' });
      expect(result.success).toBe(true);
    });

    it('rejects missing slug', () => {
      const result = CreateTenantSchema.safeParse({ name: 'Acme Corp' });
      expect(result.success).toBe(false);
    });

    it('rejects slug with uppercase letters', () => {
      const result = CreateTenantSchema.safeParse({ name: 'Acme', slug: 'Acme-Corp' });
      expect(result.success).toBe(false);
    });

    it('rejects slug with spaces', () => {
      const result = CreateTenantSchema.safeParse({ name: 'Acme', slug: 'acme corp' });
      expect(result.success).toBe(false);
    });

    it('rejects missing name', () => {
      const result = CreateTenantSchema.safeParse({ slug: 'acme' });
      expect(result.success).toBe(false);
    });

    it('rejects name shorter than 2 chars', () => {
      const result = CreateTenantSchema.safeParse({ name: 'A', slug: 'a' });
      expect(result.success).toBe(false);
    });
  });

  describe('InviteMemberSchema', () => {
    it('accepts valid email invite', () => {
      const result = InviteMemberSchema.safeParse({ email: 'alice@example.com', role: 'VIEWER' });
      expect(result.success).toBe(true);
    });

    it('accepts ADMIN role', () => {
      const result = InviteMemberSchema.safeParse({ email: 'bob@example.com', role: 'ADMIN' });
      expect(result.success).toBe(true);
    });

    it('defaults role to VIEWER', () => {
      const result = InviteMemberSchema.safeParse({ email: 'carol@example.com' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.role).toBe('VIEWER');
    });

    it('rejects invalid email', () => {
      const result = InviteMemberSchema.safeParse({ email: 'not-an-email', role: 'VIEWER' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid role', () => {
      const result = InviteMemberSchema.safeParse({ email: 'alice@example.com', role: 'SUPERADMIN' });
      expect(result.success).toBe(false);
    });
  });
});

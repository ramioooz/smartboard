import { CreateDatasetSchema, PaginationSchema } from '@smartboard/shared';

describe('svc-datasets — schema validation', () => {
  describe('CreateDatasetSchema', () => {
    it('accepts valid CSV dataset', () => {
      const result = CreateDatasetSchema.safeParse({ name: 'Sales Q1', fileType: 'csv' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.fileType).toBe('csv');
    });

    it('defaults fileType to csv when omitted', () => {
      const result = CreateDatasetSchema.safeParse({ name: 'My Data' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.fileType).toBe('csv');
    });

    it('accepts json fileType', () => {
      const result = CreateDatasetSchema.safeParse({ name: 'Events', fileType: 'json' });
      expect(result.success).toBe(true);
    });

    it('accepts optional description', () => {
      const result = CreateDatasetSchema.safeParse({ name: 'Sales', description: 'Monthly sales' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.description).toBe('Monthly sales');
    });

    it('rejects missing name', () => {
      const result = CreateDatasetSchema.safeParse({ fileType: 'csv' });
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const result = CreateDatasetSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid fileType', () => {
      const result = CreateDatasetSchema.safeParse({ name: 'Data', fileType: 'xlsx' });
      expect(result.success).toBe(false);
    });
  });

  describe('PaginationSchema', () => {
    it('defaults to page 1 limit 50', () => {
      const result = PaginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });

    it('coerces string numbers', () => {
      const result = PaginationSchema.parse({ page: '2', limit: '10' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('rejects limit over 200', () => {
      const result = PaginationSchema.safeParse({ limit: '999' });
      expect(result.success).toBe(false);
    });

    it('rejects page less than 1', () => {
      const result = PaginationSchema.safeParse({ page: '0' });
      expect(result.success).toBe(false);
    });

    it('accepts limit of exactly 200', () => {
      const result = PaginationSchema.safeParse({ limit: '200' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.limit).toBe(200);
    });
  });
});

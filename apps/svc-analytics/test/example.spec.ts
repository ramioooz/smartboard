import { TimeseriesQuerySchema } from '@smartboard/shared';

describe('svc-analytics — schema validation', () => {
  describe('TimeseriesQuerySchema', () => {
    const base = {
      datasetId: 'cm5abc123def456ghi789jkl0', // valid cuid2
      metric: 'revenue',
      from: '2024-01-01T00:00:00Z',
      to: '2024-01-02T00:00:00Z',
    };

    it('accepts valid query', () => {
      const result = TimeseriesQuerySchema.safeParse(base);
      expect(result.success).toBe(true);
    });

    it('defaults bucket to hour', () => {
      const result = TimeseriesQuerySchema.safeParse(base);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.bucket).toBe('hour');
    });

    it('coerces from/to strings to Date objects', () => {
      const result = TimeseriesQuerySchema.safeParse(base);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.from).toBeInstanceOf(Date);
        expect(result.data.to).toBeInstanceOf(Date);
      }
    });

    it('accepts day bucket', () => {
      const result = TimeseriesQuerySchema.safeParse({ ...base, bucket: 'day' });
      expect(result.success).toBe(true);
    });

    it('accepts all valid bucket values', () => {
      const buckets = ['minute', 'hour', 'day', 'week', 'month'];
      for (const bucket of buckets) {
        const result = TimeseriesQuerySchema.safeParse({ ...base, bucket });
        expect(result.success).toBe(true);
      }
    });

    it('rejects missing datasetId', () => {
      const { datasetId: _, ...rest } = base;
      const result = TimeseriesQuerySchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects invalid datasetId', () => {
      const result = TimeseriesQuerySchema.safeParse({ ...base, datasetId: 'invalid id!' });
      expect(result.success).toBe(false);
    });

    it('rejects missing metric', () => {
      const { metric: _, ...rest } = base;
      const result = TimeseriesQuerySchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects invalid bucket', () => {
      const result = TimeseriesQuerySchema.safeParse({ ...base, bucket: 'fortnight' });
      expect(result.success).toBe(false);
    });
  });
});

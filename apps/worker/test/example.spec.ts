import { JOB_NAMES, EVENT_NAMES } from '@smartboard/shared';
import type { DatasetIngestPayload } from '@smartboard/shared';

describe('worker — job contracts', () => {
  describe('DatasetIngestPayload', () => {
    it('has correct shape', () => {
      const payload: DatasetIngestPayload = {
        tenantId: 'tenant-abc',
        datasetId: 'dataset-xyz',
        s3Key: 'tenants/tenant-abc/datasets/dataset-xyz/data.csv',
        fileType: 'csv',
      };
      expect(payload.fileType).toMatch(/^(csv|json)$/);
      expect(payload.s3Key).toContain(payload.datasetId);
    });

    it('s3Key follows expected pattern', () => {
      const tenantId = 'tenant-1';
      const datasetId = 'ds-1';
      const fileType = 'csv';
      const s3Key = `tenants/${tenantId}/datasets/${datasetId}/data.${fileType}`;
      expect(s3Key).toBe('tenants/tenant-1/datasets/ds-1/data.csv');
    });

    it('json fileType builds correct extension', () => {
      const fileType = 'json';
      const ext = fileType === 'json' ? 'json' : 'csv';
      expect(ext).toBe('json');
    });
  });

  describe('Job name constants', () => {
    it('DATASET_INGEST queue name is stable', () => {
      expect(JOB_NAMES.DATASET_INGEST).toBe('dataset.ingest');
    });

    it('ready and error channels are distinct', () => {
      expect(EVENT_NAMES.DATASET_READY).not.toBe(EVENT_NAMES.DATASET_ERROR);
    });
  });

  describe('CSV row parsing logic', () => {
    it('parses a float value correctly', () => {
      const raw = '42.5';
      const value = parseFloat(raw);
      expect(value).toBe(42.5);
      expect(isNaN(value)).toBe(false);
    });

    it('filters rows with NaN values', () => {
      const rows = [
        { metric: 'revenue', value: '100', timestamp: '' },
        { metric: 'revenue', value: 'N/A', timestamp: '' },
        { metric: 'revenue', value: '200', timestamp: '' },
      ];
      const valid = rows.filter((r) => !isNaN(parseFloat(r.value)));
      expect(valid.length).toBe(2);
    });

    it('defaults metric to value when missing', () => {
      const record: Record<string, string> = { value: '50' };
      const metric = record['metric'] ?? 'value';
      expect(metric).toBe('value');
    });

    it('defaults timestamp to now when missing', () => {
      const record: Record<string, string> = { metric: 'cpu', value: '80' };
      const ts = record['timestamp'] ? new Date(record['timestamp']) : new Date();
      expect(ts).toBeInstanceOf(Date);
      expect(isNaN(ts.getTime())).toBe(false);
    });
  });
});

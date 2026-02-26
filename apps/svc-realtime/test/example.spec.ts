import { EVENT_NAMES } from '@smartboard/shared';
import type { DatasetReadyEvent, DatasetErrorEvent } from '@smartboard/shared';

describe('svc-realtime — event contracts', () => {
  it('DatasetReadyEvent shape is correct', () => {
    const event: DatasetReadyEvent = {
      event: EVENT_NAMES.DATASET_READY,
      tenantId: 'tenant-1',
      datasetId: 'dataset-1',
      rowCount: 1000,
      processedAt: new Date().toISOString(),
    };
    expect(event.event).toBe('dataset.ready');
    expect(typeof event.rowCount).toBe('number');
    expect(event.rowCount).toBeGreaterThanOrEqual(0);
  });

  it('DatasetErrorEvent shape is correct', () => {
    const event: DatasetErrorEvent = {
      event: EVENT_NAMES.DATASET_ERROR,
      tenantId: 'tenant-1',
      datasetId: 'dataset-1',
      reason: 'CSV parse error on row 5',
      failedAt: new Date().toISOString(),
    };
    expect(event.event).toBe('dataset.error');
    expect(event.reason.length).toBeGreaterThan(0);
  });

  it('events are serialisable as JSON', () => {
    const event: DatasetReadyEvent = {
      event: EVENT_NAMES.DATASET_READY,
      tenantId: 'tenant-1',
      datasetId: 'ds-abc',
      rowCount: 42,
      processedAt: '2024-01-01T00:00:00Z',
    };
    const json = JSON.stringify(event);
    const parsed = JSON.parse(json) as DatasetReadyEvent;
    expect(parsed.datasetId).toBe(event.datasetId);
    expect(parsed.rowCount).toBe(42);
  });

  it('channel names are non-empty strings', () => {
    expect(EVENT_NAMES.DATASET_READY).toBeTruthy();
    expect(EVENT_NAMES.DATASET_ERROR).toBeTruthy();
  });
});

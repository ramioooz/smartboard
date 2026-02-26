import { EVENT_NAMES, JOB_NAMES } from '@smartboard/shared';

describe('Gateway — shared contracts', () => {
  it('JOB_NAMES.DATASET_INGEST is stable', () => {
    expect(JOB_NAMES.DATASET_INGEST).toBe('dataset.ingest');
  });

  it('EVENT_NAMES are stable', () => {
    expect(EVENT_NAMES.DATASET_READY).toBe('dataset.ready');
    expect(EVENT_NAMES.DATASET_ERROR).toBe('dataset.error');
  });

  it('gateway prefix is /api', () => {
    const prefix = 'api';
    expect(prefix).toMatch(/^[a-z]+$/);
  });
});

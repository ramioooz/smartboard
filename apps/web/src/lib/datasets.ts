import { apiFetch } from './api';
import { getTenantId } from './tenant';
import type { ApiOk, PagedResult } from '@smartboard/shared';

export interface Dataset {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  fileType: 'csv' | 'json';
  status: 'created' | 'uploaded' | 'processing' | 'ready' | 'error';
  rowCount?: number;
  s3Key?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDatasetResult {
  dataset: Dataset;
  uploadUrl: string;
}

export interface TimeseriesRow {
  bucket: string;
  avg: number;
  min: number;
  max: number;
  count: number;
}

function ctx() {
  return { tenantId: getTenantId() ?? undefined };
}

export async function listDatasets(page = 1, limit = 50): Promise<PagedResult<Dataset>> {
  const res = await apiFetch<ApiOk<PagedResult<Dataset>>>(
    `/api/datasets?page=${page}&limit=${limit}`,
    ctx(),
  );
  return res.data;
}

export async function createDataset(body: {
  name: string;
  description?: string;
  fileType?: 'csv' | 'json';
}): Promise<CreateDatasetResult> {
  const res = await apiFetch<ApiOk<CreateDatasetResult>>('/api/datasets', {
    method: 'POST',
    body: JSON.stringify(body),
    ...ctx(),
  });
  return res.data;
}

export async function getDataset(id: string): Promise<Dataset> {
  const res = await apiFetch<ApiOk<Dataset>>(`/api/datasets/${id}`, ctx());
  return res.data;
}

export async function deleteDataset(id: string): Promise<void> {
  await apiFetch<ApiOk<{ id: string }>>(`/api/datasets/${id}`, {
    method: 'DELETE',
    ...ctx(),
  });
}

/** Upload a file directly to MinIO using the presigned PUT URL. */
export async function uploadFile(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'text/csv' },
  });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }
}

/** Fetch timeseries data for a dataset metric from the analytics service. */
export async function fetchTimeseries(params: {
  datasetId: string;
  metric: string;
  from: string;
  to: string;
  bucket?: string;
}): Promise<TimeseriesRow[]> {
  const qs = new URLSearchParams({
    datasetId: params.datasetId,
    metric: params.metric,
    from: params.from,
    to: params.to,
    bucket: params.bucket ?? 'hour',
  }).toString();

  const res = await apiFetch<ApiOk<TimeseriesRow[]>>(
    `/api/analytics/timeseries?${qs}`,
    ctx(),
  );
  return res.data;
}

export async function fetchDatasetMetrics(datasetId: string): Promise<string[]> {
  const qs = new URLSearchParams({ datasetId }).toString();
  const res = await apiFetch<ApiOk<string[]>>(`/api/analytics/metrics?${qs}`, ctx());
  return res.data;
}

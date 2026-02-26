import { apiFetch } from './api';
import { getUserId } from './auth';
import { getTenantId } from './tenant';
import type { ApiOk, PagedResult } from '@smartboard/shared';

export interface PanelLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Panel {
  id: string;
  type: 'kpi' | 'timeseries' | 'table' | 'text';
  title: string;
  datasetId?: string;
  config: Record<string, unknown>;
  layout: PanelLayout;
}

export interface Dashboard {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  panels: Panel[];
  createdAt: string;
  updatedAt: string;
}

function ctx() {
  return { userId: getUserId() ?? undefined, tenantId: getTenantId() ?? undefined };
}

export async function listDashboards(): Promise<PagedResult<Dashboard>> {
  const res = await apiFetch<ApiOk<PagedResult<Dashboard>>>('/api/dashboards', ctx());
  return res.data;
}

export async function getDashboard(id: string): Promise<Dashboard> {
  const res = await apiFetch<ApiOk<Dashboard>>(`/api/dashboards/${id}`, ctx());
  return res.data;
}

export async function createDashboard(body: {
  name: string;
  description?: string;
}): Promise<Dashboard> {
  const res = await apiFetch<ApiOk<Dashboard>>('/api/dashboards', {
    ...ctx(),
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function saveLayout(id: string, panels: Panel[]): Promise<Dashboard> {
  const res = await apiFetch<ApiOk<Dashboard>>(`/api/dashboards/${id}/layout`, {
    ...ctx(),
    method: 'PUT',
    body: JSON.stringify({ panels }),
  });
  return res.data;
}

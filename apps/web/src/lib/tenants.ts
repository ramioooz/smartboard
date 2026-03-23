import { apiFetch } from './api';
import type { ApiOk, CreateTenant, PagedResult } from '@smartboard/shared';

export interface TenantMember {
  id: string;
  tenantId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'VIEWER';
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  members: TenantMember[];
}

export async function listTenants(): Promise<PagedResult<Tenant>> {
  const res = await apiFetch<ApiOk<PagedResult<Tenant>>>('/api/tenants');
  return res.data;
}

export async function createTenant(body: CreateTenant): Promise<Tenant> {
  const res = await apiFetch<ApiOk<Tenant>>('/api/tenants', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.data;
}

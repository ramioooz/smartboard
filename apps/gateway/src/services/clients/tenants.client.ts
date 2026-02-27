import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { RequestContextService } from '../../context/request-context.service';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const TENANTS_SERVICE_URL = requireEnv('TENANTS_SERVICE_URL');

@Injectable()
export class TenantsClient {
  constructor(private readonly rcs: RequestContextService) {}

  private buildHeaders(): Record<string, string> {
    const ctx = this.rcs.getOrUndefined();
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (ctx?.requestId) headers['x-request-id'] = ctx.requestId;
    if (ctx?.userId) headers['x-user-id'] = ctx.userId;
    if (ctx?.tenantId) headers['x-tenant-id'] = ctx.tenantId;
    return headers;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${TENANTS_SERVICE_URL}${path}`, {
      method: 'GET',
      headers: this.buildHeaders(),
    }).catch(() => {
      throw new ServiceUnavailableException('svc-tenants is unreachable');
    });
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    const res = await fetch(`${TENANTS_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(data),
    }).catch(() => {
      throw new ServiceUnavailableException('svc-tenants is unreachable');
    });
    return res.json() as Promise<T>;
  }
}

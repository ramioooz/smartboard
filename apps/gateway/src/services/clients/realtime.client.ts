import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { RequestContextService } from '../../context/request-context.service';

const REALTIME_SERVICE_URL =
  process.env['REALTIME_SERVICE_URL'] ?? 'http://localhost:4060';

@Injectable()
export class RealtimeClient {
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
    const res = await fetch(`${REALTIME_SERVICE_URL}${path}`, {
      method: 'GET',
      headers: this.buildHeaders(),
    }).catch(() => {
      throw new ServiceUnavailableException('svc-realtime is unreachable');
    });
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    const res = await fetch(`${REALTIME_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(data),
    }).catch(() => {
      throw new ServiceUnavailableException('svc-realtime is unreachable');
    });
    return res.json() as Promise<T>;
  }
}

import { ServiceUnavailableException } from '@nestjs/common';
import { RequestContextService } from '../context/request-context.service';

/**
 * Shared HTTP transport for all downstream-service services.
 *
 * Concrete services extend this class, pass their service URL and name via
 * `super()`, and get `get / post / patch / put / delete` for free.
 * Context headers (x-request-id, x-user-id, x-tenant-id) are injected
 * automatically from the request-scoped AsyncLocalStorage context.
 */
export abstract class BaseService {
  constructor(
    private readonly rcs: RequestContextService,
    private readonly serviceUrl: string,
    private readonly serviceName: string,
  ) {}

  protected buildHeaders(): Record<string, string> {
    const ctx = this.rcs.getOrUndefined();
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (ctx?.requestId) headers['x-request-id'] = ctx.requestId;
    if (ctx?.userId) headers['x-user-id'] = ctx.userId;
    if (ctx?.tenantId) headers['x-tenant-id'] = ctx.tenantId;
    return headers;
  }

  private unavailable(): never {
    throw new ServiceUnavailableException(`${this.serviceName} is unreachable`);
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.serviceUrl}${path}`, {
      method: 'GET',
      headers: this.buildHeaders(),
    }).catch(() => this.unavailable());
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    const res = await fetch(`${this.serviceUrl}${path}`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(data),
    }).catch(() => this.unavailable());
    return res.json() as Promise<T>;
  }

  async patch<T>(path: string, data: unknown): Promise<T> {
    const res = await fetch(`${this.serviceUrl}${path}`, {
      method: 'PATCH',
      headers: this.buildHeaders(),
      body: JSON.stringify(data),
    }).catch(() => this.unavailable());
    return res.json() as Promise<T>;
  }

  async put<T>(path: string, data: unknown): Promise<T> {
    const res = await fetch(`${this.serviceUrl}${path}`, {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: JSON.stringify(data),
    }).catch(() => this.unavailable());
    return res.json() as Promise<T>;
  }

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${this.serviceUrl}${path}`, {
      method: 'DELETE',
      headers: this.buildHeaders(),
    }).catch(() => this.unavailable());
    return res.json() as Promise<T>;
  }
}

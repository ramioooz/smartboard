import { ServiceUnavailableException } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { RequestContextService } from '../context/request-context.service';

/**
 * Shared HTTP transport for all downstream-service services.
 *
 * Concrete services extend this class, pass their service URL and name via
 * `super()`, and get `get / post / patch / put / delete` for free.
 * Context headers (x-request-id, x-user-id, x-tenant-id) are injected
 * automatically via a request interceptor.
 *
 * Subclasses can add their own interceptors via `this.http` — e.g. for
 * retries, auth token refresh, or per-service error handling.
 */
export abstract class BaseService {
  protected readonly http: AxiosInstance;

  constructor(
    private readonly rcs: RequestContextService,
    serviceUrl: string,
    private readonly serviceName: string,
  ) {
    this.http = axios.create({ baseURL: serviceUrl });

    this.http.interceptors.request.use((config) => {
      const ctx = this.rcs.getOrUndefined();
      if (ctx?.requestId) config.headers['x-request-id'] = ctx.requestId;
      if (ctx?.userId)    config.headers['x-user-id']    = ctx.userId;
      if (ctx?.tenantId)  config.headers['x-tenant-id']  = ctx.tenantId;
      return config;
    });
  }

  protected handleError(err: unknown): never {
    if (err instanceof AxiosError) {
      const status = err.response?.status ?? 'unreachable';
      throw new ServiceUnavailableException(`${this.serviceName} returned ${status}`);
    }
    throw new ServiceUnavailableException(`${this.serviceName} is unreachable`);
  }

  private async request<T>(method: string, path: string, data?: unknown): Promise<T> {
    try {
      const { data: body } = await this.http.request<T>({ method, url: path, data });
      return body;
    } catch (err) {
      this.handleError(err);
    }
  }

  get<T>(path: string)                  { return this.request<T>('GET',    path); }
  post<T>(path: string, data: unknown)  { return this.request<T>('POST',   path, data); }
  patch<T>(path: string, data: unknown) { return this.request<T>('PATCH',  path, data); }
  put<T>(path: string, data: unknown)   { return this.request<T>('PUT',    path, data); }
  delete<T>(path: string)               { return this.request<T>('DELETE', path); }
}

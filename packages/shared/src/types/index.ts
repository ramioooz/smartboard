/**
 * Core domain types shared across the smartboard platform.
 */

export type Role = 'OWNER' | 'ADMIN' | 'VIEWER';

export type Theme = 'light' | 'dark';
export type Scheme = 'mint' | 'warm' | 'neon' | 'ember';

// ─── Request Context ──────────────────────────────────────────────────────────

export interface RequestContext {
  requestId: string;
  userId?: string;
  tenantId?: string;
  roles?: Role[];
  ip?: string;
  userAgent?: string;
}

// ─── API Envelope ─────────────────────────────────────────────────────────────

export interface ApiOk<T> {
  ok: true;
  data: T;
  requestId?: string;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

export type ApiResponse<T> = ApiOk<T> | ApiError;

// ─── Health ───────────────────────────────────────────────────────────────────

export interface HealthLive {
  status: 'ok';
  service: string;
  timestamp: string;
}

export interface HealthReady {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  checks: Record<string, 'ok' | 'error'>;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

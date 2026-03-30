import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';

/**
 * Fastify-aware throttler guard.
 *
 * NestJS's default ThrottlerGuard reads `req.ip` which in Fastify is the
 * direct socket peer address — fine for a single-process setup but wrong
 * behind a reverse proxy (nginx sets X-Forwarded-For, not the raw socket IP).
 *
 * When Fastify is started with `trustProxy: true` (see main.ts) it parses
 * X-Forwarded-For and exposes the client IP chain as `req.ips[]`.  The real
 * client is always the *last* entry because nginx appends the peer address
 * it sees, so earlier entries cannot be spoofed to bypass rate limits.
 *
 * Registered globally in AppModule — applies to every route automatically.
 * Use @SkipThrottle() on health endpoints, and @Throttle({…}) on auth
 * endpoints to override the global limits with tighter values.
 */
@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  override async canActivate(context: import('@nestjs/common').ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const path = req.routeOptions?.url ?? req.url ?? '';

    if (
      process.env['DEV_BYPASS_AUTH'] === 'true' &&
      req.method === 'POST' &&
      (path === '/auth/session' || path === '/api/auth/session')
    ) {
      return true;
    }

    return super.canActivate(context);
  }

  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const fastifyReq = req as unknown as FastifyRequest;
    // ips[] is populated by Fastify from X-Forwarded-For when trustProxy:true.
    // Last entry = IP that nginx saw (can't be faked by the client).
    const ip = fastifyReq.ips?.at(-1) ?? fastifyReq.ip;
    return ip ?? 'unknown';
  }
}

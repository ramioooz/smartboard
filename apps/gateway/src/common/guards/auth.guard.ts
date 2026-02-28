import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { IncomingMessage } from 'node:http';
import { verify } from 'jsonwebtoken';
import { requireEnv } from '@smartboard/shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestContextService } from '../../context/request-context.service';

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rcs: RequestContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<IncomingMessage>();
    const ctx = this.rcs.get();

    // x-tenant-id is always passed by the client to select the active tenant.
    // A user can belong to many tenants and picks one per request.
    const tenantId = request.headers['x-tenant-id'] as string | undefined;
    if (tenantId) ctx.tenantId = tenantId;

    // ── DEV_BYPASS_AUTH ────────────────────────────────────────────────────
    // When true, accept a bare x-user-id header so developers can hit the
    // gateway with plain cURL without generating a real token.
    // Production must have DEV_BYPASS_AUTH=false (or unset).
    const devBypass = process.env['DEV_BYPASS_AUTH'] === 'true';
    if (devBypass) {
      const userId = request.headers['x-user-id'] as string | undefined;
      if (userId) {
        ctx.userId = userId;
        return true;
      }
      // No x-user-id in dev bypass — fall through to JWT so clients
      // that do send a real token still work even in dev mode.
    }

    // ── JWT verification (stateless) ──────────────────────────────────────
    // The gateway verifies the signature locally with the shared JWT_SECRET.
    // No network call to svc-auth — O(1), truly stateless, every replica
    // can independently verify any request.
    //
    // TODO (future): add a Redis blocklist check for immediate invalidation
    // on logout, before the token naturally expires.
    const authHeader = request.headers['authorization'] as string | undefined;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
      throw new UnauthorizedException(
        devBypass
          ? 'Missing x-user-id header or Authorization: Bearer <token>'
          : 'Missing Authorization: Bearer <token>',
      );
    }

    try {
      const payload = verify(token, requireEnv('JWT_SECRET')) as JwtPayload;
      ctx.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

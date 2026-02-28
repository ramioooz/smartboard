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

    // x-tenant-id is always explicit — a user can belong to many tenants
    // and selects one per request. Identity comes from the JWT, not a header.
    const tenantId = request.headers['x-tenant-id'] as string | undefined;
    if (tenantId) ctx.tenantId = tenantId;

    // ── JWT verification (stateless, identical in dev and prod) ────────────
    // The gateway verifies the JWT signature locally using the shared
    // JWT_SECRET. No network call to svc-auth is ever made — O(1), fully
    // stateless, every gateway replica can verify any request independently.
    //
    // For local development and Insomnia/cURL testing, generate a long-lived
    // dev token once with:
    //   node scripts/gen-dev-token.mjs
    //
    // TODO (future): add a Redis JTI blocklist check here for immediate
    // token invalidation on logout before the token naturally expires.
    const authHeader = request.headers['authorization'] as string | undefined;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
      throw new UnauthorizedException('Missing Authorization: Bearer <token>');
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

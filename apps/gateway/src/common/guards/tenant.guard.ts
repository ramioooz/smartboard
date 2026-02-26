import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestContextService } from '../../context/request-context.service';

// Accepts cuid2, UUID, or any non-empty opaque ID — reject only empty/whitespace
const TenantIdSchema = /^[a-zA-Z0-9_-]{1,64}$/;

@Injectable()
export class TenantGuard implements CanActivate {
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

    const ctx = this.rcs.get();

    // No tenantId is acceptable for auth-only routes (e.g. login, /me)
    if (!ctx.tenantId) return true;

    if (!TenantIdSchema.test(ctx.tenantId)) {
      throw new ForbiddenException('Invalid tenant identifier');
    }

    return true;
  }
}

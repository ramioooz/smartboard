import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { UuidSchema } from '@smartboard/shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { RequestContextService } from '../../context/request-context.service';

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

    const result = UuidSchema.safeParse(ctx.tenantId);
    if (!result.success) {
      throw new ForbiddenException('Invalid tenant identifier');
    }

    return true;
  }
}

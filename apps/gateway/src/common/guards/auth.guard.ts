import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { IncomingMessage } from 'node:http';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { RequestContextService } from '../../context/request-context.service';

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
    const userId = request.headers['x-user-id'] as string | undefined;
    const tenantId = request.headers['x-tenant-id'] as string | undefined;

    if (!userId && !tenantId) {
      throw new UnauthorizedException('Missing x-user-id and x-tenant-id headers');
    }

    // Mutate the existing ALS context — middleware already called storage.run(ctx, next)
    const ctx = this.rcs.get();
    if (userId) ctx.userId = userId;
    if (tenantId) ctx.tenantId = tenantId;

    return true;
  }
}

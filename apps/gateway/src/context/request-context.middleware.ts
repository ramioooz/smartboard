import type { NestMiddleware } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RequestContextService } from './request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly rcs: RequestContextService) {}

  use(req: IncomingMessage, _res: ServerResponse, next: () => void): void {
    const requestId =
      (req.headers['x-request-id'] as string | undefined) ?? crypto.randomUUID();

    const ctx = {
      requestId,
      ip: req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
      // userId and tenantId are populated later by AuthGuard
    };

    this.rcs.run(ctx, next);
  }
}

import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { InjectPinoLogger } from 'nestjs-pino';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RequestContextService } from '../../context/request-context.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @InjectPinoLogger(LoggingInterceptor.name)
    private readonly logger: PinoLogger,
    private readonly rcs: RequestContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<IncomingMessage>();
    const startMs = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<ServerResponse>();
          const ctx = this.rcs.getOrUndefined();
          this.logger.info(
            {
              method: req.method,
              url: req.url,
              statusCode: res.statusCode,
              durationMs: Date.now() - startMs,
              requestId: ctx?.requestId,
              userId: ctx?.userId,
              tenantId: ctx?.tenantId,
            },
            'request completed',
          );
        },
        error: (err: unknown) => {
          const ctx = this.rcs.getOrUndefined();
          this.logger.error(
            {
              method: req.method,
              url: req.url,
              durationMs: Date.now() - startMs,
              requestId: ctx?.requestId,
              userId: ctx?.userId,
              tenantId: ctx?.tenantId,
              err,
            },
            'request failed',
          );
        },
      }),
    );
  }
}

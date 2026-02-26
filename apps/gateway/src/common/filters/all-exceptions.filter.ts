import type { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { ServerResponse } from 'node:http';
import type { ApiError } from '@smartboard/shared';
import type { RequestContextService } from '../../context/request-context.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly rcs: RequestContextService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<ServerResponse>();

    const requestId = this.rcs.getOrUndefined()?.requestId;

    let status: number;
    let code: string;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        code = `HTTP_${status}`;
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        const r = response as Record<string, unknown>;
        code = (r['error'] as string | undefined) ?? `HTTP_${status}`;
        message = Array.isArray(r['message'])
          ? (r['message'] as string[]).join(', ')
          : ((r['message'] as string | undefined) ?? exception.message);
      } else {
        code = `HTTP_${status}`;
        message = exception.message;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_SERVER_ERROR';
      message = 'An unexpected error occurred';
    }

    const body: ApiError = {
      ok: false,
      error: { code, message },
      requestId,
    };

    const json = JSON.stringify(body);
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(json);
  }
}

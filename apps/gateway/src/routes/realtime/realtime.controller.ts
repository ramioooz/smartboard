import { Controller, Get, Headers, Res, BadRequestException } from '@nestjs/common';
import type { ServerResponse } from 'node:http';
import type { RequestContextService } from '../../context/request-context.service';

const REALTIME_SERVICE_URL =
  process.env['REALTIME_SERVICE_URL'] ?? 'http://localhost:4060';

@Controller('realtime')
export class RealtimeController {
  constructor(private readonly rcs: RequestContextService) {}

  /**
   * SSE proxy: GET /api/realtime/stream
   * Forwards the request to svc-realtime and pipes the event-stream back.
   */
  @Get('stream')
  async stream(
    @Headers('x-tenant-id') tenantId: string,
    @Res() res: ServerResponse,
  ): Promise<void> {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');

    const ctx = this.rcs.getOrUndefined();
    const headers: Record<string, string> = {
      'x-tenant-id': tenantId,
      Accept: 'text/event-stream',
    };
    if (ctx?.requestId) headers['x-request-id'] = ctx.requestId;
    if (ctx?.userId) headers['x-user-id'] = ctx.userId;

    const upstream = await fetch(`${REALTIME_SERVICE_URL}/events/stream`, { headers });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);

    if (upstream.body) {
      const reader = upstream.body.getReader();
      const pump = async (): Promise<void> => {
        while (true) {
          const { done, value } = await reader.read();
          if (done || res.writableEnded) break;
          res.write(Buffer.from(value));
        }
        if (!res.writableEnded) res.end();
      };

      res.on('close', () => {
        reader.cancel().catch(() => undefined);
      });

      await pump();
    } else {
      res.end();
    }
  }
}

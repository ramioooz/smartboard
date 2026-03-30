import { Controller, Get, Headers, Res, BadRequestException } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { RequestContextService } from '../context/request-context.service';
import { requireEnv } from '@smartboard/shared';

const REALTIME_SERVICE_URL = requireEnv('REALTIME_SERVICE_URL');
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

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
    @Headers('origin') origin: string | undefined,
    @Res() reply: FastifyReply,
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

    const raw = reply.raw;
    raw.setHeader('Content-Type', 'text/event-stream');
    raw.setHeader('Cache-Control', 'no-cache');
    raw.setHeader('Connection', 'keep-alive');
    if (origin && this.getAllowedOrigins().includes(origin)) {
      raw.setHeader('Access-Control-Allow-Origin', origin);
      raw.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    raw.writeHead(200);

    if (upstream.body) {
      const reader = upstream.body.getReader();
      const pump = async (): Promise<void> => {
        while (true) {
          const { done, value } = await reader.read();
          if (done || raw.writableEnded) break;
          raw.write(Buffer.from(value));
        }
        if (!raw.writableEnded) raw.end();
      };

      raw.on('close', () => {
        reader.cancel().catch(() => undefined);
      });

      await pump();
    } else {
      raw.end();
    }
  }

  private getAllowedOrigins(): string[] {
    const configured = process.env['CORS_ORIGINS']
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (configured && configured.length > 0) {
      return configured;
    }

    return DEFAULT_CORS_ORIGINS;
  }
}

import { Controller, Get, Headers, Res, BadRequestException } from '@nestjs/common';
import type { ServerResponse } from 'node:http';
import type { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * SSE stream: GET /events/stream
   * Client subscribes and receives dataset.ready / dataset.error events
   * for their tenant as newline-delimited JSON (text/event-stream).
   */
  @Get('stream')
  stream(
    @Headers('x-tenant-id') tenantId: string,
    @Res() res: ServerResponse,
  ): void {
    if (!tenantId) throw new BadRequestException('Missing x-tenant-id header');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);

    // Send a heartbeat comment every 20 s to keep proxies from closing the connection
    const heartbeat = setInterval(() => {
      if (!res.writableEnded) res.write(': heartbeat\n\n');
    }, 20_000);

    const unsubscribe = this.eventsService.subscribe(tenantId, (payload) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    });

    res.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  }
}

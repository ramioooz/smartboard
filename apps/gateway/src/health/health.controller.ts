import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('live')
  live() {
    return {
      status: 'ok',
      service: 'smartboard-gateway',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  ready() {
    return {
      status: 'ok',
      service: 'smartboard-gateway',
      timestamp: new Date().toISOString(),
      checks: {},
    };
  }
}

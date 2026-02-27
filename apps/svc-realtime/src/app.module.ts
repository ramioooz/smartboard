import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { EventsModule } from './events/events.module';
import { getInstanceId } from '@smartboard/shared';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env['LOG_LEVEL'] ?? 'info',
        base: { instance: getInstanceId() },
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    RedisModule,
    HealthModule,
    EventsModule,
  ],
})
export class AppModule {}

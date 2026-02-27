import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { DatasetsModule } from './datasets/datasets.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { MinioModule } from './minio/minio.module';
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
    PrismaModule,
    RedisModule,
    MinioModule,
    HealthModule,
    DatasetsModule,
  ],
})
export class AppModule {}

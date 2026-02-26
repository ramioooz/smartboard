import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

const PORT = process.env['PORT'] ?? '4050';
const SERVICE = 'smartboard-svc-dashboards';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  await app.listen(PORT, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.error(`[${SERVICE}] Fatal error during bootstrap`, err);
  process.exit(1);
});

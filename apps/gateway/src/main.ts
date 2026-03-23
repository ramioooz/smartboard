import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { requireEnv, getInstanceId } from '@smartboard/shared';

const SERVICE = 'smartboard-gateway';

process.on('unhandledRejection', (reason: unknown) => {
  console.error(`[${SERVICE}] Unhandled rejection`, reason);
  process.exit(1);
});
process.on('uncaughtException', (err: Error) => {
  console.error(`[${SERVICE}] Uncaught exception`, err);
  process.exit(1);
});

const PORT = requireEnv('PORT');
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function getCorsOrigins(): string[] {
  const raw = process.env['CORS_ORIGINS'];
  if (!raw) return DEFAULT_CORS_ORIGINS;

  const parsed = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : DEFAULT_CORS_ORIGINS;
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    // trustProxy: true — tells Fastify to parse X-Forwarded-For set by nginx
    // so that req.ips[] contains the real client IP chain (needed for accurate
    // per-IP rate limiting in ThrottlerBehindProxyGuard).
    new FastifyAdapter({ trustProxy: true }),
    { bufferLogs: true },
  );
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });
  app.setGlobalPrefix('api', {
    exclude: ['health/live', 'health/ready'],
  });
  (app.getHttpAdapter().getInstance() as {
    addHook(event: 'onSend', fn: (req: unknown, reply: { header(k: string, v: string): void }) => Promise<void>): void;
  }).addHook('onSend', async (_request, reply) => {
    reply.header('X-Instance-Id', getInstanceId());
  });
  await app.listen(PORT, '0.0.0.0');
}

bootstrap().catch((err: unknown) => {
  console.error(`[${SERVICE}] Fatal error during bootstrap`, err);
  process.exit(1);
});

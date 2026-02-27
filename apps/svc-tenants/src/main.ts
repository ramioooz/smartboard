import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { requireEnv, getInstanceId } from '@smartboard/shared';

const SERVICE = 'smartboard-svc-tenants';

process.on('unhandledRejection', (reason: unknown) => {
  console.error(`[${SERVICE}] Unhandled rejection`, reason);
  process.exit(1);
});
process.on('uncaughtException', (err: Error) => {
  console.error(`[${SERVICE}] Uncaught exception`, err);
  process.exit(1);
});

const PORT = requireEnv('PORT');

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
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

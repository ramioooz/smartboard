import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

const PORT = process.env['PORT'] ?? '4010';
const SERVICE_NAME = 'smartboard-svc-auth';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  app.enableShutdownHooks();

  await app.listen(PORT, '0.0.0.0');
  Logger.log(`${SERVICE_NAME} listening on port ${PORT}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap', err);
  process.exit(1);
});

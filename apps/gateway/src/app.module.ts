import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, hours, minutes, seconds } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { LoggerModule } from 'nestjs-pino';
import Redis from 'ioredis';
import { HealthModule } from './health/health.module';
import { RequestContextModule } from './context/request-context.module';
import { AuthGuard } from './common/guards/auth.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { ThrottlerBehindProxyGuard } from './common/guards/throttler.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { DatasetsModule } from './datasets/datasets.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RealtimeModule } from './realtime/realtime.module';
import { getInstanceId, requireEnv } from '@smartboard/shared';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env['LOG_LEVEL'],
        base: { instance: getInstanceId() },
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),

    // ── Rate limiting (Layer 2 — per-user-IP, Redis-backed) ─────────────────
    //
    // Three named throttlers evaluated on every request (unless @SkipThrottle):
    //
    //   short  — 20 req/s     → absorbs micro-bursts, stops script flooding
    //   medium — 300 req/min  → sustained API usage cap per client IP
    //   long   — 5000 req/hr  → hourly budget; prevents slow-burn scraping
    //
    // Storage is Redis so limits are shared across all gateway replicas
    // (scale gateway=N and every replica contributes to the same counters).
    //
    // Auth endpoints override these with much tighter values via @Throttle().
    // Health endpoints are exempted via @SkipThrottle().
    //
    // Layer 1 (nginx) still blocks raw floods before they reach the app at all.
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const redis = new Redis(requireEnv('REDIS_URL'), {
          // lazyConnect avoids a startup failure if Redis is briefly unavailable;
          // the first real throttle-check will establish the connection.
          lazyConnect: true,
          // Dedicated key prefix so throttler entries don't collide with BullMQ
          // or pub/sub keys that other services store in the same Redis instance.
          keyPrefix: 'gw:throttle:',
        });

        return {
          throttlers: [
            { name: 'short',  ttl: seconds(1),  limit: 20   },
            { name: 'medium', ttl: minutes(1),  limit: 300  },
            { name: 'long',   ttl: hours(1),    limit: 5000 },
          ],
          storage: new ThrottlerStorageRedisService(redis),
        };
      },
    }),

    RequestContextModule, // @Global — must come before feature modules
    HealthModule,
    AuthModule,
    TenantsModule,
    DatasetsModule,
    DashboardsModule,
    AnalyticsModule,
    RealtimeModule,
  ],
  providers: [
    // Guard execution order matters:
    //   1. ThrottlerBehindProxyGuard — reject rate-limited requests first (cheap)
    //   2. AuthGuard                 — verify JWT and hydrate RequestContext
    //   3. TenantGuard               — validate tenant membership
    { provide: APP_GUARD, useClass: ThrottlerBehindProxyGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { RequestContextModule } from './context/request-context.module';
import { AuthGuard } from './common/guards/auth.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuthModule } from './routes/auth/auth.module';
import { TenantsModule } from './routes/tenants/tenants.module';
import { DatasetsModule } from './routes/datasets/datasets.module';
import { DashboardsModule } from './routes/dashboards/dashboards.module';
import { AnalyticsModule } from './routes/analytics/analytics.module';
import { RealtimeModule } from './routes/realtime/realtime.module';
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
    // Guards run in registration order: AuthGuard hydrates context, TenantGuard validates it
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}

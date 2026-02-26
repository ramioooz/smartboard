import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { RequestContextModule } from './context/request-context.module';
import { ServicesModule } from './services/services.module';
import { AuthGuard } from './common/guards/auth.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuthController } from './routes/auth/auth.controller';
import { TenantsController } from './routes/tenants/tenants.controller';
import { DatasetsController } from './routes/datasets/datasets.controller';
import { DashboardsController } from './routes/dashboards/dashboards.controller';
import { AnalyticsController } from './routes/analytics/analytics.controller';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env['LOG_LEVEL'] ?? 'info',
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    RequestContextModule, // @Global — must come before ServicesModule
    ServicesModule,
    HealthModule,
  ],
  controllers: [
    AuthController,
    TenantsController,
    DatasetsController,
    DashboardsController,
    AnalyticsController,
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

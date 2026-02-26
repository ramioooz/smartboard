import { Module } from '@nestjs/common';
import { AuthClient } from './clients/auth.client';
import { TenantsClient } from './clients/tenants.client';
import { DatasetsClient } from './clients/datasets.client';
import { AnalyticsClient } from './clients/analytics.client';
import { DashboardsClient } from './clients/dashboards.client';
import { RealtimeClient } from './clients/realtime.client';

@Module({
  providers: [
    AuthClient,
    TenantsClient,
    DatasetsClient,
    AnalyticsClient,
    DashboardsClient,
    RealtimeClient,
  ],
  exports: [
    AuthClient,
    TenantsClient,
    DatasetsClient,
    AnalyticsClient,
    DashboardsClient,
    RealtimeClient,
  ],
})
export class ServicesModule {}

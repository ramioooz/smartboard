import { Module } from '@nestjs/common';
import { DashboardsClient } from '../../services/clients/dashboards.client';
import { DashboardsController } from './dashboards.controller';

@Module({
  controllers: [DashboardsController],
  providers: [DashboardsClient],
})
export class DashboardsModule {}

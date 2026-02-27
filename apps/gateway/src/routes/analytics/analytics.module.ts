import { Module } from '@nestjs/common';
import { AnalyticsClient } from '../../services/clients/analytics.client';
import { AnalyticsController } from './analytics.controller';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsClient],
})
export class AnalyticsModule {}

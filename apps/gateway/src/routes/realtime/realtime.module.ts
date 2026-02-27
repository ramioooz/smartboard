import { Module } from '@nestjs/common';
import { RealtimeClient } from '../../services/clients/realtime.client';
import { RealtimeController } from './realtime.controller';

@Module({
  controllers: [RealtimeController],
  providers: [RealtimeClient],
})
export class RealtimeModule {}

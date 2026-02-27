import { Module } from '@nestjs/common';
import { TenantsClient } from '../../services/clients/tenants.client';
import { TenantsController } from './tenants.controller';

@Module({
  controllers: [TenantsController],
  providers: [TenantsClient],
})
export class TenantsModule {}

import { Module } from '@nestjs/common';
import { DatasetsClient } from '../../services/clients/datasets.client';
import { DatasetsController } from './datasets.controller';

@Module({
  controllers: [DatasetsController],
  providers: [DatasetsClient],
})
export class DatasetsModule {}

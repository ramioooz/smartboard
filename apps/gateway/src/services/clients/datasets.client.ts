import { Injectable } from '@nestjs/common';
import { requireEnv } from '@smartboard/shared';
import { RequestContextService } from '../../context/request-context.service';
import { BaseClient } from './base.client';

@Injectable()
export class DatasetsClient extends BaseClient {
  constructor(rcs: RequestContextService) {
    super(rcs, requireEnv('DATASETS_SERVICE_URL'), 'svc-datasets');
  }
}

import { Injectable } from '@nestjs/common';
import { requireEnv } from '@smartboard/shared';
import { RequestContextService } from '../context/request-context.service';
import { BaseService } from '../common/base.service';

@Injectable()
export class DatasetsService extends BaseService {
  constructor(rcs: RequestContextService) {
    super(rcs, requireEnv('DATASETS_SERVICE_URL'), 'svc-datasets');
  }
}

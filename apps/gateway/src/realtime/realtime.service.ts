import { Injectable } from '@nestjs/common';
import { requireEnv } from '@smartboard/shared';
import { RequestContextService } from '../context/request-context.service';
import { BaseService } from '../common/base.service';

@Injectable()
export class RealtimeService extends BaseService {
  constructor(rcs: RequestContextService) {
    super(rcs, requireEnv('REALTIME_SERVICE_URL'), 'svc-realtime');
  }
}

import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { RequestContext } from '@smartboard/shared';

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  run(ctx: RequestContext, fn: () => void): void {
    this.storage.run(ctx, fn);
  }

  get(): RequestContext {
    const ctx = this.storage.getStore();
    if (!ctx) {
      throw new Error('RequestContext accessed outside of a request scope');
    }
    return ctx;
  }

  getOrUndefined(): RequestContext | undefined {
    return this.storage.getStore();
  }
}

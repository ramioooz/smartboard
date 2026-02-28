import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';
import type { SmartboardEvent } from '@smartboard/shared';
import { EVENT_CHANNEL } from '@smartboard/shared';
import { RedisService } from '../redis/redis.service';

type Listener = (event: SmartboardEvent) => void;

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  // Dedicated subscriber connection (ioredis subscriber cannot issue normal commands)
  private subscriber!: Redis;
  // tenantId → Set of listener callbacks
  private readonly listeners = new Map<string, Set<Listener>>();

  constructor(private readonly redis: RedisService) {}

  onModuleInit(): void {
    // Create a separate Redis connection for subscribe mode
    this.subscriber = this.redis.getClient().duplicate();

    // Single channel — all platform events arrive here regardless of type.
    // Adding new event types (EVENT_NAMES) requires no change to this file.
    void this.subscriber.subscribe(EVENT_CHANNEL);

    this.subscriber.on('message', (_channel: string, message: string) => {
      try {
        const event = JSON.parse(message) as SmartboardEvent;
        const tenantListeners = this.listeners.get(event.tenantId);
        if (tenantListeners) {
          for (const cb of tenantListeners) {
            cb(event);
          }
        }
      } catch (err) {
        this.logger.error('Failed to parse Redis message', err);
      }
    });

    this.logger.log(`Subscribed to Redis channel: ${EVENT_CHANNEL}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.subscriber.quit();
  }

  /** Subscribe a client to events for a specific tenant. Returns an unsubscribe fn. */
  subscribe(tenantId: string, listener: Listener): () => void {
    if (!this.listeners.has(tenantId)) {
      this.listeners.set(tenantId, new Set());
    }
    this.listeners.get(tenantId)!.add(listener);
    this.logger.log(`SSE client subscribed for tenant ${tenantId}`);

    return () => {
      const set = this.listeners.get(tenantId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) this.listeners.delete(tenantId);
      }
      this.logger.log(`SSE client unsubscribed for tenant ${tenantId}`);
    };
  }
}

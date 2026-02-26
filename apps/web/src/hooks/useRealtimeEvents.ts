'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getTenantId } from '@/lib/tenant';
import { getUserId } from '@/lib/auth';

const BASE = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:4000';

interface DatasetEvent {
  event: 'dataset.ready' | 'dataset.error';
  tenantId: string;
  datasetId: string;
  rowCount?: number;
  processedAt?: string;
  reason?: string;
  failedAt?: string;
}

/**
 * Opens an SSE connection to the gateway realtime stream and
 * invalidates React Query caches when dataset processing completes.
 */
export function useRealtimeEvents(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const tenantId = getTenantId();
    const userId = getUserId();
    if (!tenantId || !userId) return;

    const url = `${BASE}/api/realtime/stream`;

    // EventSource doesn't support custom headers — use fetch with ReadableStream instead
    const controller = new AbortController();

    void (async () => {
      try {
        const res = await fetch(url, {
          headers: {
            'x-tenant-id': tenantId,
            'x-user-id': userId,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
        });

        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const payload = JSON.parse(line.slice(6)) as DatasetEvent;

                if (payload.event === 'dataset.ready' || payload.event === 'dataset.error') {
                  // Invalidate datasets list and the specific dataset
                  void queryClient.invalidateQueries({ queryKey: ['datasets'] });
                  void queryClient.invalidateQueries({ queryKey: ['dataset', payload.datasetId] });
                  // Also invalidate analytics data for this dataset
                  void queryClient.invalidateQueries({ queryKey: ['timeseries', payload.datasetId] });
                }
              } catch {
                // Ignore parse errors on individual SSE messages
              }
            }
          }
        }
      } catch {
        // AbortError on cleanup — ignore
      }
    })();

    return () => {
      controller.abort();
    };
  }, [queryClient]);
}

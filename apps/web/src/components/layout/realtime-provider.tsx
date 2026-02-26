'use client';

import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';

/** Mount this once inside the app layout to open the SSE connection. */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeEvents();
  return <>{children}</>;
}

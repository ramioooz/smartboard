'use client';

import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';
import { useTenant } from './tenant-bootstrap';

/** Mount this once inside the app layout to open the SSE connection. */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { currentTenant } = useTenant();
  useRealtimeEvents(currentTenant.id);
  return <>{children}</>;
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '../components/layout/tenant-bootstrap';
import {
  createDashboard,
  getDashboard,
  listDashboards,
  saveLayout,
} from '../lib/dashboards';
import type { Dashboard, Panel } from '../lib/dashboards';

export function useDashboards() {
  const { currentTenant } = useTenant();

  return useQuery<Dashboard[]>({
    queryKey: ['dashboards', currentTenant.id],
    queryFn: async () => {
      const result = await listDashboards();
      return result.items;
    },
    staleTime: 30_000,
    enabled: !!currentTenant.id,
  });
}

export function useDashboard(id: string) {
  const { currentTenant } = useTenant();

  return useQuery<Dashboard>({
    queryKey: ['dashboard', currentTenant.id, id],
    queryFn: () => getDashboard(id),
    staleTime: 30_000,
    enabled: !!id && !!currentTenant.id,
  });
}

export function useCreateDashboard() {
  const qc = useQueryClient();
  const { currentTenant } = useTenant();
  return useMutation<Dashboard, Error, { name: string; description?: string }>({
    mutationFn: createDashboard,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dashboards', currentTenant.id] });
    },
  });
}

export function useSaveLayout() {
  const qc = useQueryClient();
  const { currentTenant } = useTenant();
  return useMutation<Dashboard, Error, { id: string; panels: Panel[] }>({
    mutationFn: ({ id, panels }) => saveLayout(id, panels),
    onSuccess: (dashboard) => {
      qc.setQueryData(['dashboard', currentTenant.id, dashboard.id], dashboard);
    },
  });
}

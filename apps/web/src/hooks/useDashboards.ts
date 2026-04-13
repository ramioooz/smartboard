'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '../components/layout/tenant-bootstrap';
import {
  createDashboard,
  deleteDashboard,
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

export function useDashboard(id: string, options: { enabled?: boolean } = {}) {
  const { currentTenant } = useTenant();

  return useQuery<Dashboard>({
    queryKey: ['dashboard', currentTenant.id, id],
    queryFn: () => getDashboard(id),
    staleTime: 30_000,
    enabled: (options.enabled ?? true) && !!id && !!currentTenant.id,
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
      qc.setQueryData<Dashboard[] | undefined>(['dashboards', currentTenant.id], (existing) =>
        existing?.map((item) => (item.id === dashboard.id ? dashboard : item)),
      );
      void qc.invalidateQueries({ queryKey: ['dashboards', currentTenant.id] });
    },
  });
}

export function useDeleteDashboard() {
  const qc = useQueryClient();
  const { currentTenant } = useTenant();

  return useMutation<void, Error, string>({
    mutationFn: deleteDashboard,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['dashboard', currentTenant.id, id] });
    },
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ['dashboard', currentTenant.id, id] });
      qc.setQueryData<Dashboard[] | undefined>(['dashboards', currentTenant.id], (existing) =>
        existing?.filter((item) => item.id !== id),
      );
      void qc.invalidateQueries({ queryKey: ['dashboards', currentTenant.id] });
    },
  });
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDashboard,
  getDashboard,
  listDashboards,
  saveLayout,
} from '../lib/dashboards';
import type { Dashboard, Panel } from '../lib/dashboards';

export function useDashboards() {
  return useQuery<Dashboard[]>({
    queryKey: ['dashboards'],
    queryFn: async () => {
      const result = await listDashboards();
      return result.items;
    },
    staleTime: 30_000,
  });
}

export function useDashboard(id: string) {
  return useQuery<Dashboard>({
    queryKey: ['dashboard', id],
    queryFn: () => getDashboard(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useCreateDashboard() {
  const qc = useQueryClient();
  return useMutation<Dashboard, Error, { name: string; description?: string }>({
    mutationFn: createDashboard,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}

export function useSaveLayout() {
  const qc = useQueryClient();
  return useMutation<Dashboard, Error, { id: string; panels: Panel[] }>({
    mutationFn: ({ id, panels }) => saveLayout(id, panels),
    onSuccess: (dashboard) => {
      qc.setQueryData(['dashboard', dashboard.id], dashboard);
    },
  });
}

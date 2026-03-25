'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/components/layout/tenant-bootstrap';
import { createDataset, listDatasets, uploadFile } from '@/lib/datasets';

export function useDatasets() {
  const { currentTenant } = useTenant();

  return useQuery({
    queryKey: ['datasets', currentTenant.id],
    queryFn: () => listDatasets(),
    enabled: !!currentTenant.id,
  });
}

export function useCreateAndUploadDataset() {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenant();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      fileType,
      file,
    }: {
      name: string;
      description?: string;
      fileType: 'csv' | 'json';
      file: File;
    }) => {
      // 1. Create the dataset record + get presigned URL
      const { dataset, uploadUrl } = await createDataset({ name, description, fileType });

      // 2. Upload the file directly to MinIO
      await uploadFile(uploadUrl, file);

      return dataset;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['datasets', currentTenant.id] });
    },
  });
}

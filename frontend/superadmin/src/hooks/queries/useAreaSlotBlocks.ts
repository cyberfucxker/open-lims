import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAreaSlotBlockApi,
  createAreaSlotBlocksBulkApi,
  deleteAreaSlotBlockApi,
  deleteAreaSlotBlocksBulkApi,
  fetchAreaSlotBlocks,
  type AreaSlotBlockListParams,
  type AreaSlotBlockWriteData,
  type BulkCreateAreaSlotBlocksData,
} from "@/services/api/areaSlotBlockApi";

export function useAreaSlotBlocks(params: AreaSlotBlockListParams) {
  return useQuery({
    queryKey: ["area-slot-blocks", "list", params],
    queryFn: () => fetchAreaSlotBlocks(params),
    enabled: Boolean(params.areaId),
  });
}

function useInvalidateAreaSlotBlocks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["area-slot-blocks", "list"] });
}

export function useCreateAreaSlotBlock() {
  const invalidate = useInvalidateAreaSlotBlocks();
  return useMutation({
    mutationFn: (values: AreaSlotBlockWriteData) => createAreaSlotBlockApi(values),
    onSuccess: invalidate,
  });
}

export function useDeleteAreaSlotBlock() {
  const invalidate = useInvalidateAreaSlotBlocks();
  return useMutation({
    mutationFn: (id: string) => deleteAreaSlotBlockApi(id),
    onSuccess: invalidate,
  });
}

export function useCreateAreaSlotBlocksBulk() {
  const invalidate = useInvalidateAreaSlotBlocks();
  return useMutation({
    mutationFn: (values: BulkCreateAreaSlotBlocksData) => createAreaSlotBlocksBulkApi(values),
    onSuccess: invalidate,
  });
}

export function useDeleteAreaSlotBlocksBulk() {
  const invalidate = useInvalidateAreaSlotBlocks();
  return useMutation({
    mutationFn: (ids: string[]) => deleteAreaSlotBlocksBulkApi(ids),
    onSuccess: invalidate,
  });
}

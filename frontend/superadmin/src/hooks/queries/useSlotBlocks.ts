import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSlotBlockApi,
  createSlotBlocksBulkApi,
  deleteSlotBlockApi,
  deleteSlotBlocksBulkApi,
  fetchSlotBlocks,
  type BulkCreateSlotBlocksData,
  type SlotBlockListParams,
  type SlotBlockWriteData,
} from "@/services/api/slotBlockApi";

export function useSlotBlocks(params: SlotBlockListParams) {
  return useQuery({
    queryKey: ["slot-blocks", "list", params],
    queryFn: () => fetchSlotBlocks(params),
    enabled: Boolean(params.cityId),
  });
}

function useInvalidateSlotBlocks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["slot-blocks", "list"] });
}

export function useCreateSlotBlock() {
  const invalidate = useInvalidateSlotBlocks();
  return useMutation({
    mutationFn: (values: SlotBlockWriteData) => createSlotBlockApi(values),
    onSuccess: invalidate,
  });
}

export function useDeleteSlotBlock() {
  const invalidate = useInvalidateSlotBlocks();
  return useMutation({
    mutationFn: (id: string) => deleteSlotBlockApi(id),
    onSuccess: invalidate,
  });
}

export function useCreateSlotBlocksBulk() {
  const invalidate = useInvalidateSlotBlocks();
  return useMutation({
    mutationFn: (values: BulkCreateSlotBlocksData) => createSlotBlocksBulkApi(values),
    onSuccess: invalidate,
  });
}

export function useDeleteSlotBlocksBulk() {
  const invalidate = useInvalidateSlotBlocks();
  return useMutation({
    mutationFn: (ids: string[]) => deleteSlotBlocksBulkApi(ids),
    onSuccess: invalidate,
  });
}

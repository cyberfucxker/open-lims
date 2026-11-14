import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSlotTemplateApi,
  deleteSlotTemplateApi,
  fetchActiveSlotTemplates,
  fetchSlotTemplateById,
  fetchSlotTemplates,
  setSlotTemplateStatusApi,
  updateSlotTemplateApi,
  type SlotTemplateListParams,
  type SlotTemplateWriteData,
} from "@/services/api/slotTemplateApi";

export function useSlotTemplates(params: SlotTemplateListParams) {
  return useQuery({
    queryKey: ["slot-templates", "list", params],
    queryFn: () => fetchSlotTemplates(params),
    placeholderData: (prev) => prev,
  });
}

export function useActiveSlotTemplates() {
  return useQuery({
    queryKey: ["slot-templates", "active"],
    queryFn: fetchActiveSlotTemplates,
  });
}

export function useSlotTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["slot-templates", "detail", id],
    queryFn: () => fetchSlotTemplateById(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateSlotTemplates() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["slot-templates", "list"] });
    queryClient.invalidateQueries({ queryKey: ["slot-templates", "active"] });
  };
}

export function useCreateSlotTemplate() {
  const invalidate = useInvalidateSlotTemplates();
  return useMutation({
    mutationFn: (values: SlotTemplateWriteData) => createSlotTemplateApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdateSlotTemplate() {
  const invalidate = useInvalidateSlotTemplates();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SlotTemplateWriteData }) =>
      updateSlotTemplateApi(id, values),
    onSuccess: invalidate,
  });
}

export function useSetSlotTemplateStatus() {
  const invalidate = useInvalidateSlotTemplates();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setSlotTemplateStatusApi(id, active),
    onSuccess: invalidate,
  });
}

export function useDeleteSlotTemplate() {
  const invalidate = useInvalidateSlotTemplates();
  return useMutation({
    mutationFn: (id: string) => deleteSlotTemplateApi(id),
    onSuccess: invalidate,
  });
}

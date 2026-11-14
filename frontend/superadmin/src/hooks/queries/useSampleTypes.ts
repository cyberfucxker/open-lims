import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSampleTypeApi,
  deleteSampleTypeApi,
  fetchSampleTypeBarcodeConfigs,
  setSampleTypeStatusApi,
  updateSampleTypeApi,
  upsertSampleTypeBarcodeConfigApi,
  type SampleTypeBarcodeConfigFormValues,
  type SampleTypeFormValues,
} from "@/services/api/sampleTypeApi";

/** Read hooks for the sample type LIST itself live in `useMasterData.ts`
 *  (`useSampleTypes`) — every form in the app already reads them from there, so
 *  this module adds only the writes plus the barcode-config read. */

export function useSampleTypeBarcodeConfigs() {
  return useQuery({
    queryKey: ["sample-type-barcode-configs"],
    queryFn: fetchSampleTypeBarcodeConfigs,
    placeholderData: (prev) => prev,
  });
}

/** A sample type edit changes the Test form's dropdown and what the Test list
 *  and detail previews print, so those caches go too. */
function useSampleTypeInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["sample-types"] });
    queryClient.invalidateQueries({ queryKey: ["sample-type-barcode-configs"] });
    queryClient.invalidateQueries({ queryKey: ["tests"] });
    queryClient.invalidateQueries({ queryKey: ["test-detail"] });
  };
}

export function useCreateSampleType() {
  const invalidate = useSampleTypeInvalidation();
  return useMutation({
    mutationFn: (values: SampleTypeFormValues) => createSampleTypeApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdateSampleType() {
  const invalidate = useSampleTypeInvalidation();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SampleTypeFormValues }) =>
      updateSampleTypeApi(id, values),
    onSuccess: invalidate,
  });
}

export function useDeleteSampleType() {
  const invalidate = useSampleTypeInvalidation();
  return useMutation({
    mutationFn: (id: string) => deleteSampleTypeApi(id),
    onSuccess: invalidate,
  });
}

export function useSetSampleTypeStatus() {
  const invalidate = useSampleTypeInvalidation();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setSampleTypeStatusApi(id, active),
    onSuccess: invalidate,
  });
}

export function useUpsertSampleTypeBarcodeConfig() {
  const invalidate = useSampleTypeInvalidation();
  return useMutation({
    mutationFn: ({
      sampleTypeId,
      values,
    }: {
      sampleTypeId: string;
      values: SampleTypeBarcodeConfigFormValues;
    }) => upsertSampleTypeBarcodeConfigApi(sampleTypeId, values),
    onSuccess: invalidate,
  });
}

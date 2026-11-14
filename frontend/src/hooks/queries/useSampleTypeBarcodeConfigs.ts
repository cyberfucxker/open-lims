import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchSampleTypeBarcodeConfigs,
  upsertSampleTypeBarcodeConfigApi,
} from "@/services/api/sampleTypeBarcodeConfig.api";
import type { ListMasterParams, SampleTypeBarcodeConfigFormValues } from "@/types/master";

export function useSampleTypeBarcodeConfigs(params: ListMasterParams = {}) {
  return useQuery({
    queryKey: ["sampleTypeBarcodeConfigs", params],
    queryFn: () => fetchSampleTypeBarcodeConfigs(params),
    placeholderData: (prev) => prev,
  });
}

export function useUpsertSampleTypeBarcodeConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sampleTypeId,
      values,
    }: {
      sampleTypeId: string;
      values: SampleTypeBarcodeConfigFormValues;
    }) => upsertSampleTypeBarcodeConfigApi(sampleTypeId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sampleTypeBarcodeConfigs"] });
    },
  });
}

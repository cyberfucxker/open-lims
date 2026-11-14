import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchReportSettings,
  restoreDefaultReportSettingsApi,
  updateReportSettingsApi,
  uploadReportAssetApi,
} from "@/services/api/reportSettings.api";
import type { ReportAssetType, ReportSettingsFormValues } from "@/types/report";

export function useReportSettings() {
  return useQuery({
    queryKey: ["reportSettings"],
    queryFn: fetchReportSettings,
  });
}

export function useUpdateReportSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ReportSettingsFormValues) => updateReportSettingsApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportSettings"] });
    },
  });
}

export function useUploadReportAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetType, file }: { assetType: ReportAssetType; file: File }) =>
      uploadReportAssetApi(assetType, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportSettings"] });
    },
  });
}

export function useRestoreDefaultReportSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => restoreDefaultReportSettingsApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportSettings"] });
    },
  });
}

import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { ReportAssetType, ReportSettings, ReportSettingsFormValues } from "@/types/report";

export async function fetchReportSettings(): Promise<ReportSettings> {
  const response = await httpClient.get<ApiResponseBody<ReportSettings>>("/report-settings");
  return response.data.data as ReportSettings;
}

export async function updateReportSettingsApi(
  values: ReportSettingsFormValues,
): Promise<ReportSettings> {
  const response = await httpClient.put<ApiResponseBody<ReportSettings>>(
    "/report-settings",
    values,
  );
  return response.data.data as ReportSettings;
}

export async function restoreDefaultReportSettingsApi(): Promise<ReportSettings> {
  const response = await httpClient.post<ApiResponseBody<ReportSettings>>(
    "/report-settings/restore-default",
  );
  return response.data.data as ReportSettings;
}

export async function uploadReportAssetApi(
  assetType: ReportAssetType,
  file: File,
): Promise<ReportSettings> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post<ApiResponseBody<ReportSettings>>(
    `/report-settings/assets/${assetType}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data.data as ReportSettings;
}

/** Report Designer live preview + "Download Sample PDF" — `overrides` is the
 *  current (possibly unsaved) form state, merged server-side over the saved
 *  settings and rendered through the exact same PDF code path a real report
 *  uses, so the preview can never drift from the final output. */
export async function fetchReportSettingsPreviewBlob(
  overrides: ReportSettingsFormValues,
  disposition: "inline" | "attachment" = "inline",
): Promise<Blob> {
  const response = await httpClient.post(
    `/report-settings/preview?disposition=${disposition}`,
    overrides,
    {
      responseType: "blob",
      suppressErrorToast: true,
    },
  );
  return response.data as Blob;
}

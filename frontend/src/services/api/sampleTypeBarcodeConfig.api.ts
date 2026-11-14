import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  ListMasterParams,
  ListSampleTypeBarcodeConfigsResult,
  SampleTypeBarcodeConfig,
  SampleTypeBarcodeConfigFormValues,
} from "@/types/master";

export async function fetchSampleTypeBarcodeConfigs(
  params: ListMasterParams = {},
): Promise<ListSampleTypeBarcodeConfigsResult> {
  const response = await httpClient.get<ApiResponseBody<ListSampleTypeBarcodeConfigsResult>>(
    "/sample-type-barcode-configs",
    { params },
  );
  return response.data.data as ListSampleTypeBarcodeConfigsResult;
}

export async function upsertSampleTypeBarcodeConfigApi(
  sampleTypeId: string,
  values: SampleTypeBarcodeConfigFormValues,
): Promise<SampleTypeBarcodeConfig> {
  const response = await httpClient.put<ApiResponseBody<SampleTypeBarcodeConfig>>(
    `/sample-type-barcode-configs/${sampleTypeId}`,
    values,
  );
  return response.data.data as SampleTypeBarcodeConfig;
}

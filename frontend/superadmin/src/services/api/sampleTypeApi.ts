import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";
import type { SampleTypeDto } from "./masterDataApi";

export type { SampleTypeDto };

export interface SampleTypeFormValues {
  name: string;
  description?: string | null;
  active?: boolean;
}

/** The 1:1 barcode settings for a sample type. Kept in this module rather than
 *  its own because the two are edited together: `idGenerator.ts#nextSampleNo`
 *  refuses to number a sample whose type has no `prefix`, so a sample type
 *  created without one can't have samples collected against it at all. There is
 *  no other screen that sets it. */
export interface SampleTypeBarcodeConfigDto {
  sampleTypeId: string;
  sampleTypeName: string;
  prefix: string | null;
  numberLength: number;
  active: boolean;
  updatedAt: string | null;
}

export interface SampleTypeBarcodeConfigFormValues {
  prefix: string;
  numberLength?: number;
  active?: boolean;
}

export async function createSampleTypeApi(values: SampleTypeFormValues): Promise<SampleTypeDto> {
  const response = await httpClient.post<ApiResponseBody<SampleTypeDto>>("/sample-types", values, {
    suppressErrorToast: true,
  });
  return response.data.data as SampleTypeDto;
}

export async function updateSampleTypeApi(
  id: string,
  values: SampleTypeFormValues,
): Promise<SampleTypeDto> {
  const response = await httpClient.put<ApiResponseBody<SampleTypeDto>>(
    `/sample-types/${id}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as SampleTypeDto;
}

/** Soft delete — the backend refuses it while any test or collected sample still
 *  references the type (409), so the caller should surface that message. */
export async function deleteSampleTypeApi(id: string): Promise<void> {
  await httpClient.delete(`/sample-types/${id}`, { suppressErrorToast: true });
}

export async function setSampleTypeStatusApi(id: string, active: boolean): Promise<SampleTypeDto> {
  const response = await httpClient.patch<ApiResponseBody<SampleTypeDto>>(
    `/sample-types/${id}/status`,
    { active },
    { suppressErrorToast: true },
  );
  return response.data.data as SampleTypeDto;
}

/** Every sample type's barcode config in one call — the list needs it to flag
 *  types that can't be collected yet, so per-row fetching would be N requests
 *  for a table that's a dozen rows long. */
export async function fetchSampleTypeBarcodeConfigs(): Promise<
  PaginatedResult<SampleTypeBarcodeConfigDto>
> {
  const response = await httpClient.get<
    ApiResponseBody<PaginatedResult<SampleTypeBarcodeConfigDto>>
  >("/sample-type-barcode-configs", {
    params: { pageSize: 100 },
    suppressErrorToast: true,
  });
  return response.data.data as PaginatedResult<SampleTypeBarcodeConfigDto>;
}

export async function upsertSampleTypeBarcodeConfigApi(
  sampleTypeId: string,
  values: SampleTypeBarcodeConfigFormValues,
): Promise<SampleTypeBarcodeConfigDto> {
  const response = await httpClient.put<ApiResponseBody<SampleTypeBarcodeConfigDto>>(
    `/sample-type-barcode-configs/${sampleTypeId}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as SampleTypeBarcodeConfigDto;
}

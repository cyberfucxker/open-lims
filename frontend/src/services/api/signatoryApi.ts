import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  ListSignatoriesParams,
  ListSignatoriesResult,
  Signatory,
  SignatoryFormValues,
} from "@/types/signatory";

export async function fetchSignatories(
  params: ListSignatoriesParams = {},
): Promise<ListSignatoriesResult> {
  const response = await httpClient.get<ApiResponseBody<ListSignatoriesResult>>("/signatories", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as ListSignatoriesResult;
}

export async function createSignatoryApi(values: SignatoryFormValues): Promise<Signatory> {
  const response = await httpClient.post<ApiResponseBody<Signatory>>("/signatories", values, {
    suppressErrorToast: true,
  });
  return response.data.data as Signatory;
}

export async function updateSignatoryApi(
  id: string,
  values: SignatoryFormValues,
): Promise<Signatory> {
  const response = await httpClient.patch<ApiResponseBody<Signatory>>(
    `/signatories/${id}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as Signatory;
}

export async function deleteSignatoryApi(id: string): Promise<void> {
  await httpClient.delete(`/signatories/${id}`, { suppressErrorToast: true });
}

export async function uploadSignatoryImageApi(id: string, file: File): Promise<Signatory> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post<ApiResponseBody<Signatory>>(
    `/signatories/${id}/signature`,
    formData,
    { suppressErrorToast: true, headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data.data as Signatory;
}

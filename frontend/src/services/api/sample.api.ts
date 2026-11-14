import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  BulkActionResult,
  ListSamplesParams,
  ListSamplesResult,
  RejectSampleInput,
  SampleRecord,
  SampleStatusLogRecord,
} from "@/types/sample";

export async function fetchSamples(params: ListSamplesParams = {}): Promise<ListSamplesResult> {
  const response = await httpClient.get<ApiResponseBody<ListSamplesResult>>("/samples", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as ListSamplesResult;
}

export async function fetchSample(id: string): Promise<SampleRecord> {
  const response = await httpClient.get<ApiResponseBody<SampleRecord>>(`/samples/${id}`, {
    suppressErrorToast: true,
  });
  return response.data.data as SampleRecord;
}

export async function fetchSamplesByAppointment(appointmentId: string): Promise<SampleRecord[]> {
  const response = await httpClient.get<ApiResponseBody<SampleRecord[]>>(
    `/samples/by-appointment/${appointmentId}`,
    {
      suppressErrorToast: true,
    },
  );
  return response.data.data as SampleRecord[];
}

export async function collectSampleApi(id: string): Promise<SampleRecord> {
  const response = await httpClient.patch<ApiResponseBody<SampleRecord>>(
    `/samples/${id}/collect`,
    {},
    { suppressErrorToast: true },
  );
  return response.data.data as SampleRecord;
}

export async function receiveSampleApi(id: string): Promise<SampleRecord> {
  const response = await httpClient.patch<ApiResponseBody<SampleRecord>>(
    `/samples/${id}/receive`,
    {},
    { suppressErrorToast: true },
  );
  return response.data.data as SampleRecord;
}

export async function approveSampleApi(id: string): Promise<SampleRecord> {
  const response = await httpClient.patch<ApiResponseBody<SampleRecord>>(
    `/samples/${id}/approve`,
    {},
    { suppressErrorToast: true },
  );
  return response.data.data as SampleRecord;
}

export async function rejectSampleApi(id: string, input: RejectSampleInput): Promise<SampleRecord> {
  const response = await httpClient.patch<ApiResponseBody<SampleRecord>>(
    `/samples/${id}/reject`,
    input,
    {
      suppressErrorToast: true,
    },
  );
  return response.data.data as SampleRecord;
}

export async function bulkCollectSamplesApi(ids: string[]): Promise<BulkActionResult> {
  const response = await httpClient.post<ApiResponseBody<BulkActionResult>>(
    "/samples/bulk/collect",
    { ids },
    { suppressErrorToast: true },
  );
  return response.data.data as BulkActionResult;
}

export async function bulkReceiveSamplesApi(ids: string[]): Promise<BulkActionResult> {
  const response = await httpClient.post<ApiResponseBody<BulkActionResult>>(
    "/samples/bulk/receive",
    { ids },
    { suppressErrorToast: true },
  );
  return response.data.data as BulkActionResult;
}

export async function bulkApproveSamplesApi(ids: string[]): Promise<BulkActionResult> {
  const response = await httpClient.post<ApiResponseBody<BulkActionResult>>(
    "/samples/bulk/approve",
    { ids },
    { suppressErrorToast: true },
  );
  return response.data.data as BulkActionResult;
}

export async function fetchSampleHistory(id: string): Promise<SampleStatusLogRecord[]> {
  const response = await httpClient.get<ApiResponseBody<SampleStatusLogRecord[]>>(
    `/samples/${id}/history`,
    {
      suppressErrorToast: true,
    },
  );
  return response.data.data as SampleStatusLogRecord[];
}

export async function fetchSampleLabelPdfBlob(id: string): Promise<Blob> {
  const response = await httpClient.get(`/samples/${id}/label-pdf`, {
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

export async function fetchSampleLabelBatchPdfBlob(ids: string[]): Promise<Blob> {
  const response = await httpClient.post(
    "/samples/label-pdf/batch",
    { ids },
    { responseType: "blob", suppressErrorToast: true },
  );
  return response.data as Blob;
}

export async function fetchSamplesExcelBlob(params: ListSamplesParams = {}): Promise<Blob> {
  const response = await httpClient.get("/samples/export/excel", {
    params,
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

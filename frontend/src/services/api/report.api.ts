import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  ApproveTestResultInput,
  CancelReportInput,
  ListReportsParams,
  ListReportsResult,
  RejectReportInput,
  RejectTestResultInput,
  ReportAuditLogRecord,
  ReportDetails,
  SaveResultsInput,
  SaveTestResultInput,
} from "@/types/report";

export async function fetchReports(params: ListReportsParams = {}): Promise<ListReportsResult> {
  const response = await httpClient.get<ApiResponseBody<ListReportsResult>>("/reports", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as ListReportsResult;
}

export async function fetchReport(id: string): Promise<ReportDetails> {
  const response = await httpClient.get<ApiResponseBody<ReportDetails>>(`/reports/${id}`, {
    suppressErrorToast: true,
  });
  return response.data.data as ReportDetails;
}

export async function fetchReportByAppointment(appointmentId: string): Promise<ReportDetails> {
  const response = await httpClient.get<ApiResponseBody<ReportDetails>>(
    `/reports/by-appointment/${appointmentId}`,
    {
      suppressErrorToast: true,
    },
  );
  return response.data.data as ReportDetails;
}

export async function saveResultsApi(id: string, input: SaveResultsInput): Promise<ReportDetails> {
  const response = await httpClient.patch<ApiResponseBody<ReportDetails>>(
    `/reports/${id}/results`,
    input,
    {
      suppressErrorToast: true,
    },
  );
  return response.data.data as ReportDetails;
}

export async function saveTestResultApi(
  reportId: string,
  resultId: string,
  input: SaveTestResultInput,
): Promise<ReportDetails> {
  const response = await httpClient.patch<ApiResponseBody<ReportDetails>>(
    `/reports/${reportId}/results/${resultId}/save`,
    input,
    { suppressErrorToast: true },
  );
  return response.data.data as ReportDetails;
}

export async function submitTestResultApi(
  reportId: string,
  resultId: string,
): Promise<ReportDetails> {
  const response = await httpClient.patch<ApiResponseBody<ReportDetails>>(
    `/reports/${reportId}/results/${resultId}/submit`,
    {},
    { suppressErrorToast: true },
  );
  return response.data.data as ReportDetails;
}

export async function approveTestResultApi(
  reportId: string,
  resultId: string,
  input: ApproveTestResultInput,
): Promise<ReportDetails> {
  const response = await httpClient.patch<ApiResponseBody<ReportDetails>>(
    `/reports/${reportId}/results/${resultId}/approve`,
    input,
    { suppressErrorToast: true },
  );
  return response.data.data as ReportDetails;
}

export async function rejectTestResultApi(
  reportId: string,
  resultId: string,
  input: RejectTestResultInput,
): Promise<ReportDetails> {
  const response = await httpClient.patch<ApiResponseBody<ReportDetails>>(
    `/reports/${reportId}/results/${resultId}/reject`,
    input,
    { suppressErrorToast: true },
  );
  return response.data.data as ReportDetails;
}

export async function submitReportApi(id: string): Promise<ReportDetails> {
  const response = await httpClient.patch<ApiResponseBody<ReportDetails>>(
    `/reports/${id}/submit`,
    {},
    { suppressErrorToast: true },
  );
  return response.data.data as ReportDetails;
}

export async function approveReportApi(id: string): Promise<ReportDetails> {
  const response = await httpClient.patch<ApiResponseBody<ReportDetails>>(
    `/reports/${id}/approve`,
    {},
    { suppressErrorToast: true },
  );
  return response.data.data as ReportDetails;
}

export async function rejectReportApi(
  id: string,
  input: RejectReportInput,
): Promise<ReportDetails> {
  const response = await httpClient.patch<ApiResponseBody<ReportDetails>>(
    `/reports/${id}/reject`,
    input,
    {
      suppressErrorToast: true,
    },
  );
  return response.data.data as ReportDetails;
}

export async function cancelReportApi(
  id: string,
  input: CancelReportInput,
): Promise<ReportDetails> {
  const response = await httpClient.patch<ApiResponseBody<ReportDetails>>(
    `/reports/${id}/cancel`,
    input,
    {
      suppressErrorToast: true,
    },
  );
  return response.data.data as ReportDetails;
}

export async function markReportPrintedApi(id: string): Promise<ReportDetails> {
  const response = await httpClient.post<ApiResponseBody<ReportDetails>>(
    `/reports/${id}/mark-printed`,
    {},
    { suppressErrorToast: true },
  );
  return response.data.data as ReportDetails;
}

export async function fetchReportHistory(id: string): Promise<ReportAuditLogRecord[]> {
  const response = await httpClient.get<ApiResponseBody<ReportAuditLogRecord[]>>(
    `/reports/${id}/history`,
    {
      suppressErrorToast: true,
    },
  );
  return response.data.data as ReportAuditLogRecord[];
}

export async function fetchReportPdfBlob(id: string): Promise<Blob> {
  const response = await httpClient.get(`/reports/${id}/pdf`, {
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

export interface CombinedPdfOptions {
  withLetterhead: boolean;
  withPageBreak: boolean;
  withDepartmentWise: boolean;
  withVitals: boolean;
}

export async function fetchCombinedReportPdfBlob(
  reportId: string,
  resultIds: string[],
  options: CombinedPdfOptions,
): Promise<Blob> {
  const response = await httpClient.post(
    `/reports/${reportId}/pdf/combined`,
    { resultIds, ...options },
    { responseType: "blob", suppressErrorToast: true },
  );
  return response.data as Blob;
}

export async function fetchReportPrintBatchBlob(ids: string[]): Promise<Blob> {
  const response = await httpClient.post(
    "/reports/print-batch",
    { ids },
    { responseType: "blob", suppressErrorToast: true },
  );
  return response.data as Blob;
}

export async function fetchReportsExcelBlob(params: ListReportsParams = {}): Promise<Blob> {
  const response = await httpClient.get("/reports/export/excel", {
    params,
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

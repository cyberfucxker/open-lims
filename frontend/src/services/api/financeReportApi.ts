import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { FinanceReportFilters, FinanceReportResult } from "@/types/financeReport";

export async function fetchFinanceReport(
  filters: FinanceReportFilters,
): Promise<FinanceReportResult> {
  const response = await httpClient.get<ApiResponseBody<FinanceReportResult>>("/finance-reports", {
    params: filters,
    suppressErrorToast: true,
  });
  return response.data.data as FinanceReportResult;
}

export async function fetchFinanceReportExcelBlob(filters: FinanceReportFilters): Promise<Blob> {
  const response = await httpClient.get("/finance-reports/export/excel", {
    params: filters,
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

export async function fetchFinanceReportPdfBlob(filters: FinanceReportFilters): Promise<Blob> {
  const response = await httpClient.get("/finance-reports/export/pdf", {
    params: filters,
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

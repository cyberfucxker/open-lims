import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";
import type { CsvImportResult } from "./csvImport.types";

export type SampleCollectionMode = "HOME" | "LAB" | "BOTH";
export type RecommendedGender = "MALE" | "FEMALE" | "BOTH";

export const SAMPLE_COLLECTION_LABELS: Record<SampleCollectionMode, string> = {
  HOME: "Home Collection",
  LAB: "Lab Visit",
  BOTH: "Home or Lab",
};

export const RECOMMENDED_GENDER_LABELS: Record<RecommendedGender, string> = {
  MALE: "Male",
  FEMALE: "Female",
  BOTH: "Both",
};

/** Mirrors the backend's `ParameterDto` (GET /parameters, GET /parameters/:id).
 *  A Parameter is the reusable atomic analyte; `doTest` is what makes one
 *  independently bookable (and therefore attachable straight to a Package). */
export interface ParameterDto {
  id: string;
  name: string;
  shortName: string;
  /** Catalogue MRP — shown as "MRP" in the form. */
  price: number;
  offerPrice: number | null;
  doTest: boolean;
  /** Curated "actually order this a lot" flag, only meaningful alongside
   *  `doTest` — gates whether this analyte's auto-provisioned shadow Test
   *  shows up in the patient app's Tests catalogue browse. */
  isCommonlyUsed: boolean;
  /** Manual display order for this list only (ascending). */
  sortOrder: number;
  /** Sequential "S.No" — 1, 2, 3, ... in creation order. Read-only. */
  serialNo: number;
  sampleTypeId: string | null;
  sampleType: string | null;
  /** The lab's internal taxonomy (BIOCHEMISTRY, HAEMATOLOGY, …) — same table
   *  Tests use. Purely informational, kept for CSV import fidelity. */
  departmentId: string | null;
  department: string | null;
  /** The CMS category tile (Thyroid, Liver, …), managed under CMS → Categories.
   *  Not the lab's department-scoped Category that Tests use. */
  appCategoryId: string | null;
  appCategory: string | null;
  reportTime: string | null;
  sampleCollection: SampleCollectionMode;
  isFastingRequired: boolean;
  fastingHours: number | null;
  /** Days after the report is ready to send a repeat reminder; null = none. */
  followUpDays: number | null;
  /** WhatsApp template for that reminder; null = test_repeat_reminder. */
  followUpTemplate: string | null;
  recommendedFor: RecommendedGender;
  recommendedAge: string | null;
  /** Rich text (HTML). */
  description: string | null;
  /** Path under `/uploads`, or null when nothing is attached. */
  sampleReportUrl: string | null;
  active: boolean;
  /** How many Tests currently attach this analyte — read-only. */
  testCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParameterListParams {
  search?: string;
  /** "true" narrows to independently-bookable analytes — what the Package
   *  form's picker must send, since only those may be attached to a Package. */
  doTest?: "true" | "false";
  active?: "true" | "false";
  sampleTypeId?: string;
  appCategoryId?: string;
  page?: number;
  pageSize?: number;
}

export interface ParameterFormValues {
  name: string;
  shortName: string;
  price: number;
  offerPrice?: number | null;
  doTest?: boolean;
  isCommonlyUsed?: boolean;
  /** Manual Superadmin-list display order. */
  sortOrder?: number;
  sampleTypeId?: string | null;
  departmentId?: string | null;
  appCategoryId?: string | null;
  reportTime?: string | null;
  sampleCollection?: SampleCollectionMode;
  isFastingRequired?: boolean;
  fastingHours?: number | null;
  followUpDays?: number | null;
  followUpTemplate?: string | null;
  recommendedFor?: RecommendedGender;
  recommendedAge?: string | null;
  description?: string | null;
  active?: boolean;
}

export async function fetchParameters(
  params: ParameterListParams = {},
): Promise<PaginatedResult<ParameterDto>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<ParameterDto>>>(
    "/parameters",
    { params, suppressErrorToast: true },
  );
  return response.data.data as PaginatedResult<ParameterDto>;
}

export async function createParameterApi(values: ParameterFormValues): Promise<ParameterDto> {
  const response = await httpClient.post<ApiResponseBody<ParameterDto>>("/parameters", values, {
    suppressErrorToast: true,
  });
  return response.data.data as ParameterDto;
}

export async function updateParameterApi(
  id: string,
  values: ParameterFormValues,
): Promise<ParameterDto> {
  const response = await httpClient.put<ApiResponseBody<ParameterDto>>(
    `/parameters/${id}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as ParameterDto;
}

export async function deleteParameterApi(id: string): Promise<void> {
  await httpClient.delete(`/parameters/${id}`, { suppressErrorToast: true });
}

/** Attaches the optional sample lab report. A separate request from Save because
 *  a multipart upload can't ride along with the form's JSON body — which is also
 *  why the form only offers it once the parameter exists. */
export async function uploadParameterSampleReportApi(
  id: string,
  file: File,
): Promise<ParameterDto> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post<ApiResponseBody<ParameterDto>>(
    `/parameters/${id}/sample-report`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, suppressErrorToast: true },
  );
  return response.data.data as ParameterDto;
}

export async function removeParameterSampleReportApi(id: string): Promise<ParameterDto> {
  const response = await httpClient.delete<ApiResponseBody<ParameterDto>>(
    `/parameters/${id}/sample-report`,
    { suppressErrorToast: true },
  );
  return response.data.data as ParameterDto;
}

/** Downloads the current analyte list as a CSV — same column shape the import
 *  reads back, so Export doubles as the import template. */
export async function exportParametersCsv(): Promise<Blob> {
  const response = await httpClient.get("/parameters/export/csv", {
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

export async function importParametersCsv(file: File): Promise<CsvImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post<ApiResponseBody<CsvImportResult>>(
    "/parameters/import/csv",
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, suppressErrorToast: true },
  );
  return response.data.data as CsvImportResult;
}

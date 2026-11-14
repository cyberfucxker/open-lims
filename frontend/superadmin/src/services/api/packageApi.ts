import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";
import type { CsvImportResult } from "./csvImport.types";
import type { RecommendedGender } from "./parameterApi";

export type { RecommendedGender };

export interface PackageTestRef {
  testId: string;
  testName: string;
  testShortName: string;
  price: number;
}

/** A standalone (`doTest = true`) analyte the package sells directly, rather
 *  than one reached through a member Test. */
export interface PackageParameterRef {
  parameterId: string;
  parameterName: string;
  parameterShortName: string;
  price: number;
}

/** Mirrors the backend's `PackageDto` shape (GET /packages, GET /packages/:id). */
export interface PackageDto {
  id: string;
  name: string;
  /** The CMS category tile — the form's "Category" dropdown. */
  appCategoryId: string | null;
  appCategory: string | null;
  /** Declared primary specimen; null for a mixed-specimen package. */
  sampleTypeId: string | null;
  sampleType: string | null;
  /** Rich text (HTML). */
  description: string | null;
  /** Declared turnaround; null means the app derives it from the member tests. */
  reportTime: string | null;
  isFastingRequired: boolean;
  fastingHours: number | null;
  /** Days after the report is ready to send a repeat reminder; null = none. */
  followUpDays: number | null;
  /** WhatsApp template for that reminder; null = test_repeat_reminder. */
  followUpTemplate: string | null;
  recommendedFor: RecommendedGender;
  recommendedAge: string | null;
  /** Path under `/uploads`, or null when nothing is attached. */
  sampleReportUrl: string | null;
  price: number;
  testCount: number;
  tests: PackageTestRef[];
  parameterCount: number;
  parameters: PackageParameterRef[];
  active: boolean;
  offerPrice: number | null;
  isPopular: boolean;
  bookedCount: number;
  /** Manual display order for this list only (ascending) — the patient app's
   *  own catalogue still sorts by `bookedCount`. */
  sortOrder: number;
  /** Sequential "S.No" — 1, 2, 3, ... in creation order. Read-only, never
   *  admin-set. */
  serialNo: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PackageListParams {
  search?: string;
  active?: boolean;
  appCategoryId?: string;
  sampleTypeId?: string;
  page?: number;
  pageSize?: number;
}

/** The admin form always sends ids — its pickers already know them, and ids skip
 *  the short-name resolution step entirely. The backend also accepts
 *  `testShortNames`/`parameterShortNames` for CSV import and API clients; both
 *  routes converge on the same FK relations (see `package.service.ts`). */
export interface PackageFormValues {
  name: string;
  price: number;
  appCategoryId?: string | null;
  sampleTypeId?: string | null;
  description?: string | null;
  reportTime?: string | null;
  isFastingRequired?: boolean;
  fastingHours?: number | null;
  followUpDays?: number | null;
  followUpTemplate?: string | null;
  recommendedFor?: RecommendedGender;
  recommendedAge?: string | null;
  testIds: string[];
  /** Only `doTest = true` parameters may be listed — the backend rejects others. */
  parameterIds: string[];
  active?: boolean;
  offerPrice?: number | null;
  isPopular?: boolean;
  /** The "N people booked this" number the patient app shows, and what its
   *  package list sorts by — admin-set directly, nothing derives it from
   *  real orders. */
  bookedCount?: number;
  /** Manual Superadmin-list display order — see `PackageDto.sortOrder`'s
   *  doc-comment. */
  sortOrder?: number;
}

export async function fetchPackages(
  params: PackageListParams = {},
): Promise<PaginatedResult<PackageDto>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<PackageDto>>>("/packages", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as PaginatedResult<PackageDto>;
}

export async function createPackageApi(values: PackageFormValues): Promise<PackageDto> {
  const response = await httpClient.post<ApiResponseBody<PackageDto>>("/packages", values, {
    suppressErrorToast: true,
  });
  return response.data.data as PackageDto;
}

export async function updatePackageApi(id: string, values: PackageFormValues): Promise<PackageDto> {
  const response = await httpClient.put<ApiResponseBody<PackageDto>>(`/packages/${id}`, values, {
    suppressErrorToast: true,
  });
  return response.data.data as PackageDto;
}

export async function deletePackageApi(id: string): Promise<void> {
  await httpClient.delete(`/packages/${id}`, { suppressErrorToast: true });
}

export async function setPackageStatusApi(id: string, active: boolean): Promise<PackageDto> {
  const response = await httpClient.patch<ApiResponseBody<PackageDto>>(
    `/packages/${id}/status`,
    { active },
    { suppressErrorToast: true },
  );
  return response.data.data as PackageDto;
}

export async function setPackagePopularApi(id: string, isPopular: boolean): Promise<PackageDto> {
  const response = await httpClient.patch<ApiResponseBody<PackageDto>>(
    `/packages/${id}/popular`,
    { isPopular },
    { suppressErrorToast: true },
  );
  return response.data.data as PackageDto;
}

/** Attaches the optional sample lab report. A separate request from Save because
 *  a multipart upload can't ride along with the form's JSON body — which is also
 *  why the form only offers it once the package exists. */
export async function uploadPackageSampleReportApi(id: string, file: File): Promise<PackageDto> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post<ApiResponseBody<PackageDto>>(
    `/packages/${id}/sample-report`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, suppressErrorToast: true },
  );
  return response.data.data as PackageDto;
}

export async function removePackageSampleReportApi(id: string): Promise<PackageDto> {
  const response = await httpClient.delete<ApiResponseBody<PackageDto>>(
    `/packages/${id}/sample-report`,
    { suppressErrorToast: true },
  );
  return response.data.data as PackageDto;
}

/** Downloads the current Package catalogue as a CSV — same column shape
 *  `importPackagesCsv` reads back, so Export doubles as the import template. */
export async function exportPackagesCsv(): Promise<Blob> {
  const response = await httpClient.get("/packages/export/csv", {
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

export async function importPackagesCsv(file: File): Promise<CsvImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post<ApiResponseBody<CsvImportResult>>(
    "/packages/import/csv",
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, suppressErrorToast: true },
  );
  return response.data.data as CsvImportResult;
}

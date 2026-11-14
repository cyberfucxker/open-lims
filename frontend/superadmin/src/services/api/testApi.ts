import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";
import type { CsvImportResult } from "./csvImport.types";
import type { RecommendedGender } from "./parameterApi";

export type { RecommendedGender };

export type TestStatus = "Active" | "Inactive";

/** One analyte as attached to a Test — the `TestParameter` join row flattened
 *  with the `Parameter` it points at. `id` is the JOIN row's id (what reorder
 *  operates on); `parameterId` is the analyte's own id. */
export interface TestAttachedParameter {
  id: string;
  parameterId: string;
  name: string;
  shortName: string;
  price: number;
  offerPrice: number | null;
  /** The analyte's `doTest` flag. */
  bookable: boolean;
  sortOrder: number;
  unit: string | null;
  referenceRangeText: string | null;
  referenceRangeLow: number | null;
  referenceRangeHigh: number | null;
  formula: string | null;
  active: boolean;
}

/** A branch login this Test is offered at. An empty list means "available at
 *  every branch" — see the backend's `TestBranchUser` model doc-comment. */
export interface TestBranchUserRef {
  userId: string;
  username: string;
  fullName: string | null;
  organizationName: string | null;
}

/** Mirrors the backend's `LabTest` shape (GET /tests, GET /tests/:id). */
export interface LabTest {
  id: string;
  name: string;
  shortName: string;
  /** The lab's internal taxonomy — null for a Test created from the admin form,
   *  which categorises by `appCategory` instead. */
  departmentId: string | null;
  department: string | null;
  categoryId: string | null;
  category: string | null;
  /** The CMS category tile — the form's "Category" dropdown. */
  appCategoryId: string | null;
  appCategory: string | null;
  price: number;
  sampleTypeId: string;
  sampleType: string;
  reportTime: string;
  status: TestStatus;
  description: string | null;
  /** Website SEO page body (HTML); may contain the `[LOCATION]` token. */
  content: string | null;
  offerPrice: number | null;
  isPopular: boolean;
  bookedCount: number;
  /** Manual display order for this list only (ascending). */
  sortOrder: number;
  /** Sequential "S.No" — 1, 2, 3, ... in creation order. Read-only. */
  serialNo: number;
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
  /** In report order. Empty is valid — such a Test reports as one free-text line. */
  parameters: TestAttachedParameter[];
  parameterCount: number;
  /** Empty = available at every branch. */
  branchUsers: TestBranchUserRef[];
  createdAt: string;
}

export interface TestListParams {
  search?: string;
  categoryId?: string;
  departmentId?: string;
  appCategoryId?: string;
  status?: TestStatus;
  page?: number;
  pageSize?: number;
}

/** One entry of the form's parameter picker. Array ORDER is the persisted
 *  `sortOrder`, so there's no order field to send. */
export interface TestParameterLinkInput {
  parameterId: string;
}

export interface TestFormValues {
  name: string;
  shortName: string;
  sampleTypeId: string;
  price: number;
  reportTime: string;
  status: TestStatus;
  /** The CMS category tile. */
  appCategoryId?: string | null;
  /** The lab's internal taxonomy — not collected by the admin form, but accepted
   *  so CSV import and API clients can still set it. */
  departmentId?: string | null;
  categoryId?: string | null;
  description?: string | null;
  content?: string | null;
  offerPrice?: number | null;
  isPopular?: boolean;
  /** The "N people booked this" number the patient app shows — admin-set
   *  directly, nothing derives it from real orders. */
  bookedCount?: number;
  /** Manual Superadmin-list display order. */
  sortOrder?: number;
  isFastingRequired?: boolean;
  fastingHours?: number | null;
  followUpDays?: number | null;
  followUpTemplate?: string | null;
  recommendedFor?: RecommendedGender;
  recommendedAge?: string | null;
  /** Omit to leave existing attachments untouched; send `[]` to detach all. */
  parameters?: TestParameterLinkInput[];
  /** Same convention: omit to leave branch availability alone, `[]` clears it
   *  back to "available at every branch". */
  branchUserIds?: string[];
}

export async function fetchTests(params: TestListParams = {}): Promise<PaginatedResult<LabTest>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<LabTest>>>("/tests", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as PaginatedResult<LabTest>;
}

export async function fetchTest(id: string): Promise<LabTest> {
  const response = await httpClient.get<ApiResponseBody<LabTest>>(`/tests/${id}`, {
    suppressErrorToast: true,
  });
  return response.data.data as LabTest;
}

export async function createTestApi(values: TestFormValues): Promise<LabTest> {
  const response = await httpClient.post<ApiResponseBody<LabTest>>("/tests", values, {
    suppressErrorToast: true,
  });
  return response.data.data as LabTest;
}

export async function updateTestApi(id: string, values: TestFormValues): Promise<LabTest> {
  const response = await httpClient.patch<ApiResponseBody<LabTest>>(`/tests/${id}`, values, {
    suppressErrorToast: true,
  });
  return response.data.data as LabTest;
}

export async function deleteTestApi(id: string): Promise<void> {
  await httpClient.delete(`/tests/${id}`, { suppressErrorToast: true });
}

/** Toggles the Home screen's "Popular Tests" flag on its own — same
 *  convention as `packageApi.ts#setPackagePopularApi` — so the CMS's Popular
 *  Tests picker never has to resend the whole Test form just to flip one flag. */
export async function setTestPopularApi(id: string, isPopular: boolean): Promise<LabTest> {
  const response = await httpClient.patch<ApiResponseBody<LabTest>>(
    `/tests/${id}/popular`,
    { isPopular },
    { suppressErrorToast: true },
  );
  return response.data.data as LabTest;
}

/** Persists a drag-reorder without re-submitting the whole Test form.
 *  `orderedIds` are `TestAttachedParameter.id` (join-row) values. */
export async function reorderTestParametersApi(id: string, orderedIds: string[]): Promise<LabTest> {
  const response = await httpClient.patch<ApiResponseBody<LabTest>>(
    `/tests/${id}/parameters/reorder`,
    { orderedIds },
    { suppressErrorToast: true },
  );
  return response.data.data as LabTest;
}

/** Attaches the optional sample lab report. A separate request from Save because
 *  a multipart upload can't ride along with the form's JSON body — which is also
 *  why the form only offers it once the test exists. */
export async function uploadTestSampleReportApi(id: string, file: File): Promise<LabTest> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post<ApiResponseBody<LabTest>>(
    `/tests/${id}/sample-report`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, suppressErrorToast: true },
  );
  return response.data.data as LabTest;
}

export async function removeTestSampleReportApi(id: string): Promise<LabTest> {
  const response = await httpClient.delete<ApiResponseBody<LabTest>>(`/tests/${id}/sample-report`, {
    suppressErrorToast: true,
  });
  return response.data.data as LabTest;
}

/** Downloads the current Test catalogue as a CSV — same column shape
 *  `importTestsCsv` reads back, so Export doubles as the import template. */
export async function exportTestsCsv(): Promise<Blob> {
  const response = await httpClient.get("/tests/export/csv", {
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

export async function importTestsCsv(file: File): Promise<CsvImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post<ApiResponseBody<CsvImportResult>>(
    "/tests/import/csv",
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, suppressErrorToast: true },
  );
  return response.data.data as CsvImportResult;
}

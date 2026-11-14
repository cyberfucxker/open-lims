import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { RecommendedGender } from "./parameterApi";

/** Mirrors the backend's `catalogDetail.types.ts`. These are the read-only
 *  "what does this actually contain?" projections behind
 *  GET /tests/:id/details and GET /packages/:id/details — the same payload the
 *  patient app receives from its own /app/... twins, so the Superadmin preview
 *  shows exactly what a customer will see. */

export interface CatalogParameterDetail {
  id: string;
  name: string;
  shortName: string;
  /** The analyte's `doTest` flag. The patient app renders "+ Add" only where
   *  this is true; the preview badges it so an admin can verify that before
   *  publishing. */
  bookable: boolean;
}

export interface TestDetail {
  id: string;
  name: string;
  shortName: string;
  /** Null for a Test categorised only by CMS category. */
  department: string | null;
  category: string | null;
  appCategory: string | null;
  sampleType: string;
  price: number;
  offerPrice: number | null;
  reportTime: string;
  description: string | null;
  parameters: CatalogParameterDetail[];
}

export interface PackageTestDetail {
  id: string;
  name: string;
  shortName: string;
}

export interface PackageDetail {
  id: string;
  name: string;
  appCategory: string | null;
  /** Declared primary specimen; null for a mixed-specimen package. */
  sampleType: string | null;
  price: number;
  offerPrice: number | null;
  description: string | null;
  /** Declared turnaround, falling back to the first member test's own. */
  reportTime: string | null;
  isFastingRequired: boolean;
  fastingHours: number | null;
  recommendedFor: RecommendedGender;
  recommendedAge: string | null;
  tests: PackageTestDetail[];
  /** Full flattened analyte list — every parameter of every member test plus the
   *  package's own standalone ones, de-duplicated. */
  parameters: CatalogParameterDetail[];
}

export async function fetchTestDetail(id: string): Promise<TestDetail> {
  const response = await httpClient.get<ApiResponseBody<TestDetail>>(`/tests/${id}/details`, {
    suppressErrorToast: true,
  });
  return response.data.data as TestDetail;
}

export async function fetchPackageDetail(id: string): Promise<PackageDetail> {
  const response = await httpClient.get<ApiResponseBody<PackageDetail>>(`/packages/${id}/details`, {
    suppressErrorToast: true,
  });
  return response.data.data as PackageDetail;
}

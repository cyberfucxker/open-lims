import type { ListMasterParams } from "./master.types";
import type { RecommendedGender } from "./parameter.types";

export type { RecommendedGender };

export interface PackageTestSummary {
  testId: string;
  testName: string;
  testShortName: string;
  /** The Test's own `serialNo` ("S.No") — what a Package CSV's "Test IDs"
   *  column cross-references and `exportPackagesCsv` round-trips. */
  testSerialNo: number;
  price: number;
}

/** A standalone (`doTest = true`) Parameter sold directly by a Package, as
 *  opposed to one reached through a member Test. */
export interface PackageParameterSummary {
  parameterId: string;
  parameterName: string;
  parameterShortName: string;
  /** The Parameter's own `serialNo` ("S.No") — what a Package CSV's
   *  "Parameter IDs" column cross-references and `exportPackagesCsv`
   *  round-trips. */
  parameterSerialNo: number;
  price: number;
}

export interface PackageDto {
  id: string;
  name: string;
  /** The CMS category tile — the admin form's "Category" dropdown. */
  appCategoryId: string | null;
  appCategory: string | null;
  /** Declared primary specimen. Null for a mixed-specimen package — see the
   *  `Package.sampleTypeId` model doc-comment. */
  sampleTypeId: string | null;
  sampleType: string | null;
  price: number;
  offerPrice: number | null;
  /** Rich text (HTML). */
  description: string | null;
  /** Declared turnaround; null means the app derives it from the member tests. */
  reportTime: string | null;
  isFastingRequired: boolean;
  fastingHours: number | null;
  followUpDays: number | null;
  followUpTemplate: string | null;
  recommendedFor: RecommendedGender;
  recommendedAge: string | null;
  /** Path under `/uploads`, or null when nothing is attached. */
  sampleReportUrl: string | null;
  testCount: number;
  tests: PackageTestSummary[];
  parameterCount: number;
  parameters: PackageParameterSummary[];
  active: boolean;
  /** Patient App catalog fields — consumed as-is by GET /api/v1/app/catalog/packages
   *  (offer_price/tag/booked_count). `bookedCount` is admin-set directly (the
   *  "N people booked this" social-proof number, and what
   *  `catalog.service.ts#listPackages` sorts the patient app's list by) —
   *  nothing auto-increments it on a real booking. */
  isPopular: boolean;
  bookedCount: number;
  /** Manual display order for the Superadmin Packages list only (ascending)
   *  — the patient app's own catalogue still sorts by `bookedCount`. */
  sortOrder: number;
  /** Sequential "S.No" — 1, 2, 3, ... in creation order. Read-only, never
   *  admin-set (see `PackageWriteData`, which has no field for it). */
  serialNo: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Membership is accepted either as ids (the admin UI's pickers, which already
 *  know them) or as short names (CSV import and API clients). Short names are
 *  resolved to ids exactly once, at write time, in `package.service.ts` — and a
 *  name that doesn't resolve to exactly one active row is a 400, never a
 *  silently-picked row. Nothing downstream ever matches on a short name again. */
export interface PackageWriteData {
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
  testIds?: string[];
  testShortNames?: string[];
  parameterIds?: string[];
  parameterShortNames?: string[];
  active?: boolean;
  offerPrice?: number | null;
  isPopular?: boolean;
  /** The "N people booked this" number shown in the patient app, and what
   *  the app's package list sorts by (see `PackageDto.bookedCount`'s
   *  doc-comment) — admin-set, not derived from real orders. Omitted on
   *  update leaves the existing value alone. */
  bookedCount?: number;
  /** Manual Superadmin-list display order — see `PackageDto.sortOrder`'s
   *  doc-comment. Omitted on update leaves the existing value alone. */
  sortOrder?: number;
}

/** Post-resolution membership — ids only. What the repository actually writes. */
export interface PackageWriteRecord extends Omit<
  PackageWriteData,
  "testShortNames" | "parameterShortNames" | "testIds" | "parameterIds"
> {
  testIds: string[];
  parameterIds: string[];
}

export type ListPackagesParams = ListMasterParams & {
  appCategoryId?: string;
  sampleTypeId?: string;
};

export interface ListPackagesResult {
  rows: PackageDto[];
  total: number;
}

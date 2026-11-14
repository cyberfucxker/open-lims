export type SampleCollectionMode = "HOME" | "LAB" | "BOTH";
export type RecommendedGender = "MALE" | "FEMALE" | "BOTH";

/** The reusable atomic analyte — see the `Parameter` Prisma model doc-comment
 *  for what `doTest` means, why the booking fields live here rather than on the
 *  join, and why `appCategoryId` is the CMS category rather than the lab one. */
export interface ParameterDto {
  id: string;
  name: string;
  shortName: string;
  /** Catalogue MRP — labelled "MRP" in the admin form. */
  price: number;
  offerPrice: number | null;
  /** True = also sellable on its own (can be attached straight to a Package and
   *  gets a "+ Add" affordance in the patient app). */
  doTest: boolean;
  /** Curated "actually order this a lot" flag, only meaningful alongside
   *  `doTest` — gates whether this Parameter's auto-provisioned shadow Test
   *  (see `Test.sourceParameterId`) is surfaced in the patient app's Tests
   *  catalogue browse (`GET /user/tests`), separately from being bookable at
   *  all. Hundreds of `doTest` Parameters exist; only the curated subset
   *  should clutter that list. */
  isCommonlyUsed: boolean;
  /** Manual display order for the Superadmin Parameters list only (ascending)
   *  — same convention as `Package.sortOrder`. */
  sortOrder: number;
  /** Sequential "S.No" — 1, 2, 3, ... in creation order. Read-only, never
   *  admin-set. */
  serialNo: number;
  sampleTypeId: string | null;
  /** Resolved name, for lists that shouldn't have to join client-side. */
  sampleType: string | null;
  /** The lab's internal taxonomy (BIOCHEMISTRY, HAEMATOLOGY, …) — same
   *  `Department` table `Test` uses. Purely informational; kept for CSV
   *  import fidelity, not read anywhere in the booking/report pipeline. */
  departmentId: string | null;
  department: string | null;
  /** The CMS/patient-app category tile (Thyroid, Liver, …), not the lab's
   *  department-scoped Category. */
  appCategoryId: string | null;
  appCategory: string | null;
  reportTime: string | null;
  sampleCollection: SampleCollectionMode;
  isFastingRequired: boolean;
  fastingHours: number | null;
  followUpDays: number | null;
  followUpTemplate: string | null;
  recommendedFor: RecommendedGender;
  recommendedAge: string | null;
  /** Rich text (HTML). */
  description: string | null;
  /** Path under `/uploads` to an uploaded sample report, if any. */
  sampleReportUrl: string | null;
  active: boolean;
  /** How many Tests currently attach this Parameter — read-only, drives the
   *  "in use" hint and the delete guard in the admin UI. */
  testCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParameterWriteData {
  name: string;
  shortName: string;
  price: number;
  offerPrice?: number | null;
  doTest?: boolean;
  isCommonlyUsed?: boolean;
  /** Manual Superadmin-list display order — see `ParameterDto.sortOrder`'s
   *  doc-comment. Omitted on update leaves the existing value alone. */
  sortOrder?: number;
  /** Explicit "S.No" override — CSV import only (see
   *  `importParametersCsv`'s doc-comment for why): lets a re-imported CSV's
   *  own "S.No" column become the real, portable `serialNo` other CSVs
   *  (a Test CSV's "Parameter IDs" column) cross-reference. The admin form
   *  never sends this — `serialNo` stays auto-assigned (`autoincrement()`)
   *  whenever it's omitted. */
  serialNo?: number;
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
  sampleReportUrl?: string | null;
  active?: boolean;
}

export interface ListParametersParams {
  search?: string;
  /** "true" | "false" — filter to (non-)independently-bookable parameters. */
  doTest?: string;
  active?: string;
  sampleTypeId?: string;
  departmentId?: string;
  appCategoryId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListParametersResult {
  rows: ParameterDto[];
  total: number;
}

import type { RecommendedGender } from "./parameter.types";

export type TestStatus = "Active" | "Inactive";
export type { RecommendedGender };

/** One `Parameter` as attached to a Test, i.e. the `TestParameter` join row
 *  flattened with the analyte it points at. `bookable` is the linked
 *  `Parameter.doTest` — the front-end shows "+ Add" only where it's true. */
export interface TestAttachedParameter {
  /** The join row's own id — what reorder/detach operate on. */
  id: string;
  parameterId: string;
  name: string;
  shortName: string;
  price: number;
  offerPrice: number | null;
  bookable: boolean;
  sortOrder: number;
  /** Per-Test reporting context. Not exposed in the admin form yet; carried
   *  through every read/write so a later increment can edit them without a
   *  migration (same rationale as `formula`). */
  unit: string | null;
  referenceRangeText: string | null;
  referenceRangeLow: number | null;
  referenceRangeHigh: number | null;
  formula: string | null;
  active: boolean;
}

/** A branch login this Test is offered at — see the `TestBranchUser` model
 *  doc-comment for why an empty list means "every branch". */
export interface TestBranchUserRef {
  userId: string;
  username: string;
  fullName: string | null;
  organizationName: string | null;
}

export interface LabTest {
  id: string;
  name: string;
  shortName: string;
  /** The lab's internal taxonomy. Null for a Test created from the admin form,
   *  which categorises by `appCategory` instead. */
  departmentId: string | null;
  department: string | null;
  categoryId: string | null;
  category: string | null;
  /** The CMS category tile — the admin form's "Category" dropdown. */
  appCategoryId: string | null;
  appCategory: string | null;
  price: number;
  sampleTypeId: string;
  sampleType: string;
  reportTime: string;
  status: TestStatus;
  description: string | null;
  /** SEO page body (HTML) — may contain the `[LOCATION]` token, kept raw here. */
  content: string | null;
  /** Patient App catalog fields — consumed as-is by GET /api/v1/app/catalog/tests
   *  (offer_price/is_popular/booked_count). `bookedCount` is admin-set
   *  directly (the "N people booked this" social-proof number the patient
   *  app shows) — nothing auto-increments it on a real booking, by design,
   *  so it stays exactly what the admin set until they change it again. */
  offerPrice: number | null;
  isPopular: boolean;
  bookedCount: number;
  /** Manual display order for the Superadmin Tests list only (ascending) —
   *  see `Test.sortOrder`'s doc-comment. */
  sortOrder: number;
  /** Sequential "S.No" — 1, 2, 3, ... in creation order across every Test row
   *  (including shadow Tests, which this list filters out — see
   *  `Test.serialNo`'s doc-comment). Read-only, never admin-set. */
  serialNo: number;
  isFastingRequired: boolean;
  fastingHours: number | null;
  followUpDays: number | null;
  followUpTemplate: string | null;
  recommendedFor: RecommendedGender;
  recommendedAge: string | null;
  /** Path under `/uploads`, or null when nothing is attached. */
  sampleReportUrl: string | null;
  /** Attached analytes in `sortOrder`. Empty is valid and supported — Report
   *  Entry falls back to a single free-text result line for such a Test. */
  parameters: TestAttachedParameter[];
  parameterCount: number;
  /** Empty = available at every branch. */
  branchUsers: TestBranchUserRef[];
  createdAt: string;
}

/** One entry of the Test form's parameter picker. `parameterId` identifies the
 *  analyte; order in the array IS the `sortOrder` that gets persisted. */
export interface TestParameterLinkInput {
  parameterId: string;
  unit?: string | null;
  referenceRangeText?: string | null;
  referenceRangeLow?: number | null;
  referenceRangeHigh?: number | null;
  formula?: string | null;
  active?: boolean;
}

export interface TestWriteData {
  name: string;
  shortName: string;
  sampleTypeId: string;
  price: number;
  reportTime: string;
  status: TestStatus;
  /** Both optional: the admin form sets `appCategoryId` and leaves the internal
   *  department/category taxonomy alone (CSV import still sets them). */
  departmentId?: string | null;
  categoryId?: string | null;
  appCategoryId?: string | null;
  description?: string | null;
  content?: string | null;
  offerPrice?: number | null;
  isPopular?: boolean;
  /** The "N people booked this" number shown in the patient app — admin-set,
   *  not derived from real orders (see `LabTest.bookedCount`'s doc-comment).
   *  Omitted on update leaves the existing value alone. */
  bookedCount?: number;
  /** Manual Superadmin-list display order — see `LabTest.sortOrder`'s
   *  doc-comment. Omitted on update leaves the existing value alone. */
  sortOrder?: number;
  isFastingRequired?: boolean;
  fastingHours?: number | null;
  followUpDays?: number | null;
  followUpTemplate?: string | null;
  recommendedFor?: RecommendedGender;
  recommendedAge?: string | null;
  /** Omitted (undefined) on update leaves the existing attachments alone; an
   *  empty array explicitly detaches every parameter. */
  parameters?: TestParameterLinkInput[];
  /** Same convention: omitted leaves branch availability alone, `[]` clears it
   *  back to "available at every branch". */
  branchUserIds?: string[];
}

export interface ListTestsParams {
  search?: string;
  categoryId?: string;
  departmentId?: string;
  appCategoryId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface ListTestsResult {
  rows: LabTest[];
  total: number;
}

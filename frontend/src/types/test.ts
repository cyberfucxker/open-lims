export type TestStatus = "Active" | "Inactive";

export interface LabTest {
  id: string;
  name: string;
  shortName: string;
  // Optional so `data/mockTests.ts` — still consumed directly by
  // TestSelectionPanel in Patient Registration, outside this module's scope
  // — keeps type-checking without adding ids to all of its mock records.
  departmentId?: string;
  department: string;
  categoryId?: string;
  category: string;
  price: number;
  sampleTypeId?: string;
  sampleType: string;
  reportTime: string;
  referenceRange: string;
  status: TestStatus;
  description: string;
  createdAt: string;
}

export interface TestFormValues {
  name: string;
  shortName: string;
  departmentId: string;
  categoryId: string;
  price: number;
  sampleTypeId: string;
  reportTime: string;
  referenceRange: string;
  status: TestStatus;
  description: string;
}

export interface ListTestsParams {
  search?: string;
  categoryId?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface ListTestsResult {
  rows: LabTest[];
  total: number;
}

export interface TestParameter {
  id: string;
  testId: string;
  name: string;
  shortCode: string | null;
  unit: string | null;
  referenceRangeText: string | null;
  referenceRangeLow: number | null;
  referenceRangeHigh: number | null;
  formula: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestParameterFormValues {
  name: string;
  shortCode?: string | null;
  unit?: string | null;
  referenceRangeText?: string | null;
  referenceRangeLow?: number | null;
  referenceRangeHigh?: number | null;
  formula?: string | null;
  active?: boolean;
}

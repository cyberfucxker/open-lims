export interface PackageTestSummary {
  testId: string;
  testName: string;
  price: number;
}

export interface LabPackage {
  id: string;
  name: string;
  price: number;
  testCount: number;
  tests: PackageTestSummary[];
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PackageFormValues {
  name: string;
  price: number;
  testIds: string[];
  active?: boolean;
}

export interface ListPackagesParams {
  search?: string;
  active?: string;
  includeDeleted?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListPackagesResult {
  rows: LabPackage[];
  total: number;
}

export interface CommissionSlabDto {
  id: string;
  fromAmount: number;
  toAmount: number | null;
  percentage: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionSlabWriteData {
  fromAmount: number;
  toAmount?: number | null;
  percentage: number;
  active?: boolean;
}

export interface ListCommissionSlabsResult {
  rows: CommissionSlabDto[];
}

export interface CommissionResult {
  slab: CommissionSlabDto | null;
  amount: number;
}

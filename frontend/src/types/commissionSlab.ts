export interface CommissionSlab {
  id: string;
  fromAmount: number;
  toAmount: number | null;
  percentage: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionSlabFormValues {
  fromAmount: number;
  toAmount?: number | null;
  percentage: number;
  active: boolean;
}

export interface ListCommissionSlabsResult {
  rows: CommissionSlab[];
}

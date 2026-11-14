export interface PriceList {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PriceListFormValues {
  name: string;
  description?: string;
  active: boolean;
}

export interface ListPriceListsResult {
  rows: PriceList[];
  total: number;
}

export interface PriceListItem {
  testId: string;
  testName: string;
  departmentName: string;
  catalogPrice: number;
  overridePrice: number | null;
}

export interface PriceListItemWriteData {
  testId: string;
  price: number;
}

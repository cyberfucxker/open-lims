export interface HomeFaqDto {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HomeFaqWriteData {
  question: string;
  answer: string;
  isActive?: boolean;
}

export interface ListHomeFaqsParams {
  isActive?: string;
  page?: number;
  pageSize?: number;
}

export interface ListHomeFaqsResult {
  rows: HomeFaqDto[];
  total: number;
}

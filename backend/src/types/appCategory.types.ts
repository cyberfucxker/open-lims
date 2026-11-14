export interface AppCategoryDto {
  id: string;
  name: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppCategoryWriteData {
  name: string;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  isActive?: boolean;
}

export interface ListAppCategoriesParams {
  search?: string;
  isActive?: string;
  page?: number;
  pageSize?: number;
}

export interface ListAppCategoriesResult {
  rows: AppCategoryDto[];
  total: number;
}

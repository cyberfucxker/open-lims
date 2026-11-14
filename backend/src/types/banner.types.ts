export interface BannerDto {
  id: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BannerWriteData {
  imageUrl: string;
  isActive?: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
}

export interface ListBannersParams {
  isActive?: string;
  page?: number;
  pageSize?: number;
}

export interface ListBannersResult {
  rows: BannerDto[];
  total: number;
}

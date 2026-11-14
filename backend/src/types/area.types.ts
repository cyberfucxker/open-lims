export interface AreaDto {
  id: string;
  cityId: string;
  cityName: string;
  name: string;
  pincodes: string[];
  isActive: boolean;
  /** null = inherit the city's default phlebotomyCharge */
  phlebotomyCharge: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AreaWriteData {
  cityId: string;
  name: string;
  pincodes?: string[];
  isActive?: boolean;
}

export interface ListAreasParams {
  cityId?: string;
  search?: string;
  isActive?: string;
  page?: number;
  pageSize?: number;
}

export interface ListAreasResult {
  rows: AreaDto[];
  total: number;
}

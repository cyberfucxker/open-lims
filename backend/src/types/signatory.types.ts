export interface SignatoryDto {
  id: string;
  name: string;
  title: string | null;
  signaturePath: string | null;
  hasPasskey: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SignatoryWriteData {
  name: string;
  title?: string | null;
  passkey?: string | null;
  active?: boolean;
}

export interface ListSignatoriesParams {
  search?: string;
  active?: string;
  page?: number;
  pageSize?: number;
}

export interface ListSignatoriesResult {
  rows: SignatoryDto[];
  total: number;
}

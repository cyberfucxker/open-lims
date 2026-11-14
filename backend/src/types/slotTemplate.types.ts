export interface SlotTemplateDto {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  defaultCapacity: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SlotTemplateWriteData {
  title: string;
  startTime: string;
  endTime: string;
  defaultCapacity?: number;
  active?: boolean;
}

export interface ListSlotTemplatesParams {
  search?: string;
  active?: string;
  page?: number;
  pageSize?: number;
}

export interface ListSlotTemplatesResult {
  rows: SlotTemplateDto[];
  total: number;
}

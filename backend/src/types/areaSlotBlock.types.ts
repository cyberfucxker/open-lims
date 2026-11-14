export interface AreaSlotBlockDto {
  id: string;
  areaId: string;
  areaName: string;
  slotTemplateId: string;
  slotTemplateTitle: string;
  blockDate: string;
  reason: string | null;
  createdAt: string;
}

export interface AreaSlotBlockWriteData {
  areaId: string;
  slotTemplateId: string;
  blockDate: string;
  reason?: string | null;
}

export interface ListAreaSlotBlocksParams {
  areaId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** Blocks every listed template, for one area+date, in a single call —
 *  backs the admin UI's multi-select "Block Slots" action. */
export interface BulkCreateAreaSlotBlocksData {
  areaId: string;
  blockDate: string;
  slotTemplateIds: string[];
  reason?: string | null;
}

export interface BulkDeleteAreaSlotBlocksData {
  ids: string[];
}

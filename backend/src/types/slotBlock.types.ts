export interface SlotBlockDto {
  id: string;
  cityId: string;
  cityName: string;
  slotTemplateId: string;
  slotTemplateTitle: string;
  blockDate: string;
  reason: string | null;
  createdAt: string;
}

export interface SlotBlockWriteData {
  cityId: string;
  slotTemplateId: string;
  blockDate: string;
  reason?: string | null;
}

export interface ListSlotBlocksParams {
  cityId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** Blocks every listed template, for one city+date, in a single call —
 *  backs the admin UI's multi-select "Block Slots" action. */
export interface BulkCreateSlotBlocksData {
  cityId: string;
  blockDate: string;
  slotTemplateIds: string[];
  reason?: string | null;
}

export interface BulkDeleteSlotBlocksData {
  ids: string[];
}

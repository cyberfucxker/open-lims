import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

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

export interface SlotBlockListParams {
  cityId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SlotBlockWriteData {
  cityId: string;
  slotTemplateId: string;
  blockDate: string;
  reason?: string | null;
}

export async function fetchSlotBlocks(params: SlotBlockListParams = {}): Promise<SlotBlockDto[]> {
  const response = await httpClient.get<ApiResponseBody<SlotBlockDto[]>>("/slot-blocks", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as SlotBlockDto[];
}

export async function createSlotBlockApi(values: SlotBlockWriteData): Promise<SlotBlockDto> {
  const response = await httpClient.post<ApiResponseBody<SlotBlockDto>>("/slot-blocks", values, {
    suppressErrorToast: true,
  });
  return response.data.data as SlotBlockDto;
}

export async function deleteSlotBlockApi(id: string): Promise<void> {
  await httpClient.delete(`/slot-blocks/${id}`, { suppressErrorToast: true });
}

export interface BulkCreateSlotBlocksData {
  cityId: string;
  blockDate: string;
  slotTemplateIds: string[];
  reason?: string | null;
}

export async function createSlotBlocksBulkApi(
  values: BulkCreateSlotBlocksData,
): Promise<SlotBlockDto[]> {
  const response = await httpClient.post<ApiResponseBody<SlotBlockDto[]>>(
    "/slot-blocks/bulk",
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as SlotBlockDto[];
}

export async function deleteSlotBlocksBulkApi(ids: string[]): Promise<void> {
  await httpClient.post("/slot-blocks/bulk-delete", { ids }, { suppressErrorToast: true });
}

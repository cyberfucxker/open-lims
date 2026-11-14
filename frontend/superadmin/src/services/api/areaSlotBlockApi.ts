import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

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

export interface AreaSlotBlockListParams {
  areaId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AreaSlotBlockWriteData {
  areaId: string;
  slotTemplateId: string;
  blockDate: string;
  reason?: string | null;
}

export async function fetchAreaSlotBlocks(
  params: AreaSlotBlockListParams = {},
): Promise<AreaSlotBlockDto[]> {
  const response = await httpClient.get<ApiResponseBody<AreaSlotBlockDto[]>>("/area-slot-blocks", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as AreaSlotBlockDto[];
}

export async function createAreaSlotBlockApi(
  values: AreaSlotBlockWriteData,
): Promise<AreaSlotBlockDto> {
  const response = await httpClient.post<ApiResponseBody<AreaSlotBlockDto>>(
    "/area-slot-blocks",
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as AreaSlotBlockDto;
}

export async function deleteAreaSlotBlockApi(id: string): Promise<void> {
  await httpClient.delete(`/area-slot-blocks/${id}`, { suppressErrorToast: true });
}

export interface BulkCreateAreaSlotBlocksData {
  areaId: string;
  blockDate: string;
  slotTemplateIds: string[];
  reason?: string | null;
}

export async function createAreaSlotBlocksBulkApi(
  values: BulkCreateAreaSlotBlocksData,
): Promise<AreaSlotBlockDto[]> {
  const response = await httpClient.post<ApiResponseBody<AreaSlotBlockDto[]>>(
    "/area-slot-blocks/bulk",
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as AreaSlotBlockDto[];
}

export async function deleteAreaSlotBlocksBulkApi(ids: string[]): Promise<void> {
  await httpClient.post("/area-slot-blocks/bulk-delete", { ids }, { suppressErrorToast: true });
}

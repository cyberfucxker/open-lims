import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

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

export interface SlotTemplateListParams {
  search?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

export interface SlotTemplateWriteData {
  title: string;
  startTime: string;
  endTime: string;
  defaultCapacity?: number;
  active?: boolean;
}

export async function fetchSlotTemplates(
  params: SlotTemplateListParams = {},
): Promise<PaginatedResult<SlotTemplateDto>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<SlotTemplateDto>>>(
    "/slot-templates",
    { params, suppressErrorToast: true },
  );
  return response.data.data as PaginatedResult<SlotTemplateDto>;
}

/** Unpaginated, active-only — for populating slot-template pickers (city config,
 *  block dialogs, etc.) without fetching the full admin list. */
export async function fetchActiveSlotTemplates(): Promise<SlotTemplateDto[]> {
  const response = await httpClient.get<ApiResponseBody<SlotTemplateDto[]>>(
    "/slot-templates/active",
    { suppressErrorToast: true },
  );
  return response.data.data as SlotTemplateDto[];
}

export async function fetchSlotTemplateById(id: string): Promise<SlotTemplateDto> {
  const response = await httpClient.get<ApiResponseBody<SlotTemplateDto>>(`/slot-templates/${id}`, {
    suppressErrorToast: true,
  });
  return response.data.data as SlotTemplateDto;
}

export async function createSlotTemplateApi(
  values: SlotTemplateWriteData,
): Promise<SlotTemplateDto> {
  const response = await httpClient.post<ApiResponseBody<SlotTemplateDto>>(
    "/slot-templates",
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as SlotTemplateDto;
}

export async function updateSlotTemplateApi(
  id: string,
  values: SlotTemplateWriteData,
): Promise<SlotTemplateDto> {
  const response = await httpClient.put<ApiResponseBody<SlotTemplateDto>>(
    `/slot-templates/${id}`,
    values,
    { suppressErrorToast: true },
  );
  return response.data.data as SlotTemplateDto;
}

export async function setSlotTemplateStatusApi(
  id: string,
  active: boolean,
): Promise<SlotTemplateDto> {
  const response = await httpClient.patch<ApiResponseBody<SlotTemplateDto>>(
    `/slot-templates/${id}/status`,
    { active },
    { suppressErrorToast: true },
  );
  return response.data.data as SlotTemplateDto;
}

export async function deleteSlotTemplateApi(id: string): Promise<void> {
  await httpClient.delete(`/slot-templates/${id}`, { suppressErrorToast: true });
}

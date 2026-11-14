import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

export interface DaySlotResult {
  slotTemplateId: string;
  title: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  isBlocked: boolean;
  blockReason: string | null;
}

export interface LiveCapacityAreaResult {
  areaId: string;
  areaName: string;
  slots: DaySlotResult[];
}

export interface LiveCapacityParams {
  cityId: string;
  date: string;
}

export async function fetchLiveCapacity(
  params: LiveCapacityParams,
): Promise<LiveCapacityAreaResult[]> {
  const response = await httpClient.get<ApiResponseBody<LiveCapacityAreaResult[]>>(
    "/live-capacity",
    { params, suppressErrorToast: true },
  );
  return response.data.data as LiveCapacityAreaResult[];
}

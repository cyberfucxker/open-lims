import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

export interface PhlebotomistSlotStatusResult {
  phlebotomistId: string;
  name: string;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  assignedAreas: Array<{ id: string; name: string }>;
  todaysBookings: number;
  availableSlotTemplateIds: string[];
}

export interface PhlebotomistSlotStatusParams {
  cityId: string;
  date: string;
}

export async function fetchPhlebotomistSlotStatus(
  params: PhlebotomistSlotStatusParams,
): Promise<PhlebotomistSlotStatusResult[]> {
  const response = await httpClient.get<ApiResponseBody<PhlebotomistSlotStatusResult[]>>(
    "/phlebotomist-slot-status",
    { params, suppressErrorToast: true },
  );
  return response.data.data as PhlebotomistSlotStatusResult[];
}

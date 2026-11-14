import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

export interface SlotDashboardStats {
  totalCities: number;
  activeSlotTemplates: number;
  todaysBookings: number;
  blockedSlotsToday: number;
  availableCapacityToday: number;
}

export async function fetchSlotDashboardStats(): Promise<SlotDashboardStats> {
  const response = await httpClient.get<ApiResponseBody<SlotDashboardStats>>(
    "/slot-dashboard-stats",
    { suppressErrorToast: true },
  );
  return response.data.data as SlotDashboardStats;
}

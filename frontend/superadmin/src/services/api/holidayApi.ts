import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";

export interface HolidayDto {
  id: string;
  cityId: string;
  cityName: string;
  holidayDate: string;
  reason: string;
  createdAt: string;
}

export interface HolidayListParams {
  cityId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface HolidayWriteData {
  cityId: string;
  holidayDate: string;
  reason: string;
}

export async function fetchHolidays(params: HolidayListParams = {}): Promise<HolidayDto[]> {
  const response = await httpClient.get<ApiResponseBody<HolidayDto[]>>("/holidays", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as HolidayDto[];
}

export async function createHolidayApi(values: HolidayWriteData): Promise<HolidayDto> {
  const response = await httpClient.post<ApiResponseBody<HolidayDto>>("/holidays", values, {
    suppressErrorToast: true,
  });
  return response.data.data as HolidayDto;
}

export async function deleteHolidayApi(id: string): Promise<void> {
  await httpClient.delete(`/holidays/${id}`, { suppressErrorToast: true });
}

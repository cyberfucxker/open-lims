import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createHolidayApi,
  deleteHolidayApi,
  fetchHolidays,
  type HolidayListParams,
  type HolidayWriteData,
} from "@/services/api/holidayApi";

export function useHolidays(params: HolidayListParams) {
  return useQuery({
    queryKey: ["holidays", "list", params],
    queryFn: () => fetchHolidays(params),
    enabled: Boolean(params.cityId),
  });
}

function useInvalidateHolidays() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["holidays", "list"] });
}

export function useCreateHoliday() {
  const invalidate = useInvalidateHolidays();
  return useMutation({
    mutationFn: (values: HolidayWriteData) => createHolidayApi(values),
    onSuccess: invalidate,
  });
}

export function useDeleteHoliday() {
  const invalidate = useInvalidateHolidays();
  return useMutation({
    mutationFn: (id: string) => deleteHolidayApi(id),
    onSuccess: invalidate,
  });
}

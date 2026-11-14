import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchMonthlyTargets, upsertMonthlyTargetApi } from "@/services/api/monthlyTarget.api";
import type { ListMonthlyTargetsParams, MonthlyTargetFormValues } from "@/types/monthlyTarget";

export function useMonthlyTargets(params: ListMonthlyTargetsParams = {}) {
  return useQuery({
    queryKey: ["monthlyTargets", params],
    queryFn: () => fetchMonthlyTargets(params),
    placeholderData: (prev) => prev,
  });
}

export function useUpsertMonthlyTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: MonthlyTargetFormValues) => upsertMonthlyTargetApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthlyTargets"] });
    },
  });
}

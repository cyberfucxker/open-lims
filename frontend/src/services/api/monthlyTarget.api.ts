import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  ListMonthlyTargetsParams,
  ListMonthlyTargetsResult,
  MonthlyTarget,
  MonthlyTargetFormValues,
} from "@/types/monthlyTarget";

export async function fetchMonthlyTargets(
  params: ListMonthlyTargetsParams = {},
): Promise<ListMonthlyTargetsResult> {
  const response = await httpClient.get<ApiResponseBody<ListMonthlyTargetsResult>>(
    "/monthly-targets",
    { params },
  );
  return response.data.data as ListMonthlyTargetsResult;
}

export async function upsertMonthlyTargetApi(
  values: MonthlyTargetFormValues,
): Promise<MonthlyTarget> {
  const response = await httpClient.put<ApiResponseBody<MonthlyTarget>>("/monthly-targets", values);
  return response.data.data as MonthlyTarget;
}

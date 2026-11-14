import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  ListReferralIncentivesParams,
  ListReferralIncentivesResult,
} from "@/types/referralIncentive";

export async function fetchReferralIncentives(
  params: ListReferralIncentivesParams = {},
): Promise<ListReferralIncentivesResult> {
  const response = await httpClient.get<ApiResponseBody<ListReferralIncentivesResult>>(
    "/referral-incentives",
    { params },
  );
  return response.data.data as ListReferralIncentivesResult;
}

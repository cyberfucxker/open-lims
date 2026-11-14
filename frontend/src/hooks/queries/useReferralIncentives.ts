import { useQuery } from "@tanstack/react-query";

import { fetchReferralIncentives } from "@/services/api/referralIncentive.api";
import type { ListReferralIncentivesParams } from "@/types/referralIncentive";

export function useReferralIncentives(params: ListReferralIncentivesParams = {}) {
  return useQuery({
    queryKey: ["referralIncentives", params],
    queryFn: () => fetchReferralIncentives(params),
    placeholderData: (prev) => prev,
  });
}

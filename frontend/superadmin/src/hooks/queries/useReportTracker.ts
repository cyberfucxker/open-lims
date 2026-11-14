import { useQuery } from "@tanstack/react-query";

import { fetchReportTracker, type ListReportTrackerParams } from "@/services/api/reportTrackerApi";

export function useReportTracker(params: ListReportTrackerParams) {
  return useQuery({
    queryKey: ["report-tracker", params],
    queryFn: () => fetchReportTracker(params),
    placeholderData: (prev) => prev,
  });
}

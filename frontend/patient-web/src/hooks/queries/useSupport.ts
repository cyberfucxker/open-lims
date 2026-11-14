import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supportApi } from "@/services/api/supportApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { ReportIssueRequest } from "@/types";

export const SUPPORT_TICKETS_QUERY_KEY = ["support-tickets"];

export function useSupportTickets() {
  return useQuery({ queryKey: SUPPORT_TICKETS_QUERY_KEY, queryFn: supportApi.list });
}

export function useReportIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReportIssueRequest) => supportApi.reportIssue(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_TICKETS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiRequestError ? error.message : "Could not submit your message",
      );
    },
  });
}

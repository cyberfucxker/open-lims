import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveAreaApprovalRequest,
  fetchAreaApprovalRequests,
  rejectAreaApprovalRequest,
  type ListAreaApprovalRequestsParams,
} from "@/services/api/areaApprovalApi";

const KEY = "area-approval-requests";

export function useAreaApprovalRequests(params: ListAreaApprovalRequestsParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => fetchAreaApprovalRequests(params),
    placeholderData: (prev) => prev,
  });
}

export function useApproveAreaApprovalRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveAreaApprovalRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useRejectAreaApprovalRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      rejectAreaApprovalRequest(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchSupportTickets,
  setSupportTicketStatusApi,
  type SupportTicketListParams,
  type SupportTicketStatus,
} from "@/services/api/supportTicketApi";

export function useSupportTickets(params: SupportTicketListParams) {
  return useQuery({
    queryKey: ["support-tickets", params],
    queryFn: () => fetchSupportTickets(params),
    placeholderData: (prev) => prev,
  });
}

export function useSetSupportTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SupportTicketStatus }) =>
      setSupportTicketStatusApi(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["support-tickets"] }),
  });
}

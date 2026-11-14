import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addPaymentApi,
  cancelBillApi,
  fetchBillDetails,
  fetchBills,
  fetchPayments,
  fetchSendHistory,
  markBillPrintedApi,
  sendInvoiceApi,
  updateAdditionalChargesApi,
} from "@/services/api/billApi";
import type { AddPaymentInput, ListBillsParams, SendInvoiceInput } from "@/types/bill";

export function useBills(params: ListBillsParams) {
  return useQuery({
    queryKey: ["bills", params],
    queryFn: () => fetchBills(params),
    placeholderData: (prev) => prev,
  });
}

export function useBillDetails(id: string | null) {
  return useQuery({
    queryKey: ["bills", "detail", id],
    queryFn: () => fetchBillDetails(id as string),
    enabled: Boolean(id),
  });
}

export function usePayments(id: string | null) {
  return useQuery({
    queryKey: ["bills", "payments", id],
    queryFn: () => fetchPayments(id as string),
    enabled: Boolean(id),
  });
}

export function useSendHistory(id: string | null) {
  return useQuery({
    queryKey: ["bills", "send-history", id],
    queryFn: () => fetchSendHistory(id as string),
    enabled: Boolean(id),
  });
}

function useBillMutation<TInput>(mutationFn: (id: string, input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TInput }) => mutationFn(id, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["bills", "detail", id] });
    },
  });
}

export function useUpdateAdditionalCharges() {
  return useBillMutation<number>((id, additionalCharges) =>
    updateAdditionalChargesApi(id, additionalCharges),
  );
}

export function useCancelBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelBillApi(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["bills", "detail", id] });
    },
  });
}

export function useMarkPrinted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markBillPrintedApi(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["bills", "detail", id] });
    },
  });
}

export function useAddPayment() {
  return useBillMutation<AddPaymentInput>(addPaymentApi);
}

export function useSendInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SendInvoiceInput }) =>
      sendInvoiceApi(id, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["bills", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["bills", "send-history", id] });
    },
  });
}

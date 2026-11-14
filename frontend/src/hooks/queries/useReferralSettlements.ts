import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelSettlementApi,
  fetchReferralSettlement,
  fetchReferralSettlements,
  generateSettlementApi,
  markSettlementPaidApi,
} from "@/services/api/referralSettlement.api";
import type {
  GenerateSettlementInput,
  ListReferralSettlementsParams,
} from "@/types/referralSettlement";

export function useReferralSettlements(params: ListReferralSettlementsParams = {}) {
  return useQuery({
    queryKey: ["referralSettlements", params],
    queryFn: () => fetchReferralSettlements(params),
    placeholderData: (prev) => prev,
  });
}

export function useReferralSettlement(id: string | undefined) {
  return useQuery({
    queryKey: ["referralSettlements", "detail", id],
    queryFn: () => fetchReferralSettlement(id as string),
    enabled: !!id,
  });
}

export function useGenerateSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: GenerateSettlementInput) => generateSettlementApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralSettlements"] });
    },
  });
}

export function useMarkSettlementPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markSettlementPaidApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralSettlements"] });
    },
  });
}

export function useCancelSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelSettlementApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralSettlements"] });
    },
  });
}

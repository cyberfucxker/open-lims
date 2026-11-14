import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPriceListApi,
  deletePriceListApi,
  fetchPriceListPricing,
  fetchPriceLists,
  restorePriceListApi,
  savePriceListPricing,
  setPriceListStatusApi,
  updatePriceListApi,
  type ListPriceListsParams,
  type PriceListFormValues,
  type PriceListItemType,
} from "@/services/api/priceListApi";

export function usePriceLists(params: ListPriceListsParams) {
  return useQuery({
    queryKey: ["price-lists", "list", params],
    queryFn: () => fetchPriceLists(params),
    placeholderData: (prev) => prev,
  });
}

/** Invalidates both the management list and the ["price-lists","options"]
 *  dropdown the organization form reads from. */
function useInvalidatePriceLists() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["price-lists"] });
}

export function useCreatePriceList() {
  const invalidate = useInvalidatePriceLists();
  return useMutation({
    mutationFn: (values: PriceListFormValues) => createPriceListApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdatePriceList() {
  const invalidate = useInvalidatePriceLists();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PriceListFormValues }) =>
      updatePriceListApi(id, values),
    onSuccess: invalidate,
  });
}

export function useDeletePriceList() {
  const invalidate = useInvalidatePriceLists();
  return useMutation({
    mutationFn: (id: string) => deletePriceListApi(id),
    onSuccess: invalidate,
  });
}

export function useRestorePriceList() {
  const invalidate = useInvalidatePriceLists();
  return useMutation({
    mutationFn: (id: string) => restorePriceListApi(id),
    onSuccess: invalidate,
  });
}

export function useSetPriceListStatus() {
  const invalidate = useInvalidatePriceLists();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setPriceListStatusApi(id, active),
    onSuccess: invalidate,
  });
}

export function usePriceListPricing(id: string | undefined) {
  return useQuery({
    queryKey: ["price-lists", "pricing", id],
    queryFn: () => fetchPriceListPricing(id!),
    enabled: Boolean(id),
  });
}

export function useSavePriceListPricing(id: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      items: { itemType: PriceListItemType; itemId: string; price: number; isOffered: boolean }[],
    ) => savePriceListPricing(id!, items),
    onSuccess: (data) => queryClient.setQueryData(["price-lists", "pricing", id], data),
  });
}

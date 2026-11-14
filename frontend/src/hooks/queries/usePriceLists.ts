import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPriceListApi,
  deletePriceListApi,
  fetchPriceList,
  fetchPriceListItems,
  fetchPriceLists,
  restorePriceListApi,
  setPriceListItemsApi,
  setPriceListStatusApi,
  updatePriceListApi,
} from "@/services/api/priceList.api";
import type { ListMasterParams } from "@/types/master";
import type { PriceListFormValues, PriceListItemWriteData } from "@/types/priceList";

export function usePriceLists(params: ListMasterParams = {}) {
  return useQuery({
    queryKey: ["priceLists", params],
    queryFn: () => fetchPriceLists(params),
    placeholderData: (prev) => prev,
  });
}

export function usePriceList(id: string | undefined) {
  return useQuery({
    queryKey: ["priceLists", "detail", id],
    queryFn: () => fetchPriceList(id as string),
    enabled: !!id,
  });
}

export function usePriceListItems(id: string | undefined) {
  return useQuery({
    queryKey: ["priceLists", "items", id],
    queryFn: () => fetchPriceListItems(id as string),
    enabled: !!id,
  });
}

export function useCreatePriceList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PriceListFormValues) => createPriceListApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceLists"] });
    },
  });
}

export function useUpdatePriceList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PriceListFormValues }) =>
      updatePriceListApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceLists"] });
    },
  });
}

export function useDeletePriceList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePriceListApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceLists"] });
    },
  });
}

export function useRestorePriceList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restorePriceListApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceLists"] });
    },
  });
}

export function useSetPriceListStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setPriceListStatusApi(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceLists"] });
    },
  });
}

export function useSetPriceListItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: string; items: PriceListItemWriteData[] }) =>
      setPriceListItemsApi(id, items),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["priceLists", "items", id] });
    },
  });
}

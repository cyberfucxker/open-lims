import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  adjustWalletApi,
  fetchAppUser,
  fetchAppUsers,
  fetchWalletStats,
  setAppUserStatusApi,
  updateAppUserApi,
  type AdjustWalletInput,
  type AppUserFormValues,
  type ListAppUsersParams,
} from "@/services/api/appUserApi";

export function useAppUsers(params: ListAppUsersParams) {
  return useQuery({
    queryKey: ["app-users", params],
    queryFn: () => fetchAppUsers(params),
    placeholderData: (prev) => prev, // keeps old rows visible while refetching — avoids a flash to empty on filter change
  });
}

export function useAppUser(id: string | undefined) {
  return useQuery({
    queryKey: ["app-users", "detail", id],
    queryFn: () => fetchAppUser(id as string),
    enabled: !!id,
  });
}

export function useSetAppUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setAppUserStatusApi(id, isActive),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["app-users"] });
      queryClient.invalidateQueries({ queryKey: ["app-users", "detail", variables.id] });
    },
  });
}

export function useUpdateAppUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AppUserFormValues }) =>
      updateAppUserApi(id, values),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["app-users"] });
      queryClient.invalidateQueries({ queryKey: ["app-users", "detail", variables.id] });
    },
  });
}

export function useWalletStats() {
  return useQuery({
    queryKey: ["app-users", "wallet-stats"],
    queryFn: fetchWalletStats,
  });
}

export function useAdjustWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdjustWalletInput }) =>
      adjustWalletApi(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["app-users"] });
      queryClient.invalidateQueries({ queryKey: ["app-users", "detail", variables.id] });
    },
  });
}

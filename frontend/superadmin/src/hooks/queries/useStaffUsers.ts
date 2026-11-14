import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createManagerApi,
  fetchStaffUsers,
  resetManagerPasswordApi,
  updateManagerApi,
} from "@/services/api/staffUserApi";

const KEY = ["staff-users"];

export function useStaffUsers() {
  return useQuery({ queryKey: KEY, queryFn: fetchStaffUsers });
}

export function useCreateManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createManagerApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      fullName?: string;
      staffModules?: string[];
      isActive?: boolean;
    }) => updateManagerApi(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useResetManagerPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetManagerPasswordApi(id, password),
  });
}

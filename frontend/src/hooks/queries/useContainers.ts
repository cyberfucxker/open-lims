import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createContainerApi,
  deleteContainerApi,
  fetchContainers,
  restoreContainerApi,
  setContainerStatusApi,
  updateContainerApi,
} from "@/services/api/container.api";
import type { ContainerFormValues, ListMasterParams } from "@/types/master";

export function useContainers(params: ListMasterParams = {}) {
  return useQuery({
    queryKey: ["containers", params],
    queryFn: () => fetchContainers(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateContainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ContainerFormValues) => createContainerApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["containers"] });
    },
  });
}

export function useUpdateContainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ContainerFormValues }) =>
      updateContainerApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["containers"] });
    },
  });
}

export function useDeleteContainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContainerApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["containers"] });
    },
  });
}

export function useRestoreContainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreContainerApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["containers"] });
    },
  });
}

export function useSetContainerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setContainerStatusApi(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["containers"] });
    },
  });
}

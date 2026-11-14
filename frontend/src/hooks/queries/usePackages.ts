import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPackageApi,
  deletePackageApi,
  fetchPackage,
  fetchPackages,
  setPackageStatusApi,
  updatePackageApi,
} from "@/services/api/packageApi";
import type { ListPackagesParams, PackageFormValues } from "@/types/package";

export function usePackages(params: ListPackagesParams = {}) {
  return useQuery({
    queryKey: ["packages", params],
    queryFn: () => fetchPackages(params),
    placeholderData: (prev) => prev,
  });
}

export function usePackage(id: string | undefined) {
  return useQuery({
    queryKey: ["packages", "detail", id],
    queryFn: () => fetchPackage(id as string),
    enabled: !!id,
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PackageFormValues) => createPackageApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PackageFormValues }) =>
      updatePackageApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePackageApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}

export function useSetPackageStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setPackageStatusApi(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}

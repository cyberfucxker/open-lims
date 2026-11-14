import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createLandingPageApi,
  deleteLandingPageApi,
  fetchLandingPages,
  setLandingPageStatusApi,
  updateLandingPageApi,
  type LandingPageFormValues,
} from "@/services/api/landingPageApi";

const KEY = ["landing-pages"];

export function useLandingPages() {
  return useQuery({ queryKey: KEY, queryFn: fetchLandingPages });
}

export function useSaveLandingPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: LandingPageFormValues }) =>
      id ? updateLandingPageApi(id, values) : createLandingPageApi(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSetLandingPageStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setLandingPageStatusApi(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteLandingPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLandingPageApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

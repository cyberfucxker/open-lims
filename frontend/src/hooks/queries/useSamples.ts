import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveSampleApi,
  bulkApproveSamplesApi,
  bulkCollectSamplesApi,
  bulkReceiveSamplesApi,
  collectSampleApi,
  fetchSample,
  fetchSampleHistory,
  fetchSamples,
  fetchSamplesByAppointment,
  receiveSampleApi,
  rejectSampleApi,
} from "@/services/api/sample.api";
import type { ListSamplesParams, RejectSampleInput } from "@/types/sample";

export function useSamples(params: ListSamplesParams) {
  return useQuery({
    queryKey: ["samples", params],
    queryFn: () => fetchSamples(params),
    placeholderData: (prev) => prev,
  });
}

export function useSampleDetails(id: string | null) {
  return useQuery({
    queryKey: ["samples", "detail", id],
    queryFn: () => fetchSample(id as string),
    enabled: Boolean(id),
  });
}

export function useSamplesByAppointment(appointmentId: string | null) {
  return useQuery({
    queryKey: ["samples", "by-appointment", appointmentId],
    queryFn: () => fetchSamplesByAppointment(appointmentId as string),
    enabled: Boolean(appointmentId),
  });
}

export function useSampleHistory(id: string | null) {
  return useQuery({
    queryKey: ["samples", "history", id],
    queryFn: () => fetchSampleHistory(id as string),
    enabled: Boolean(id),
  });
}

function useSampleActionMutation(mutationFn: (id: string) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useCollectSample() {
  return useSampleActionMutation((id) => collectSampleApi(id));
}

export function useReceiveSample() {
  return useSampleActionMutation((id) => receiveSampleApi(id));
}

export function useApproveSample() {
  return useSampleActionMutation((id) => approveSampleApi(id));
}

export function useRejectSample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RejectSampleInput }) =>
      rejectSampleApi(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useBulkCollectSamples() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkCollectSamplesApi(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useBulkReceiveSamples() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkReceiveSamplesApi(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useBulkApproveSamples() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkApproveSamplesApi(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

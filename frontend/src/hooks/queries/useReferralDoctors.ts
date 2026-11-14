import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  assignReferralDoctorApi,
  bulkAssignReferralDoctorsApi,
  createReferralDoctorApi,
  deleteReferralDoctorApi,
  fetchReferralDoctors,
  restoreReferralDoctorApi,
  setReferralDoctorStatusApi,
  updateReferralDoctorApi,
} from "@/services/api/referralDoctor.api";
import type { ListReferralDoctorsParams, ReferralDoctorFormValues } from "@/types/referralDoctor";

export function useReferralDoctors(params: ListReferralDoctorsParams = {}) {
  return useQuery({
    queryKey: ["referralDoctors", params],
    queryFn: () => fetchReferralDoctors(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateReferralDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ReferralDoctorFormValues) => createReferralDoctorApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralDoctors"] });
    },
  });
}

export function useUpdateReferralDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ReferralDoctorFormValues }) =>
      updateReferralDoctorApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralDoctors"] });
    },
  });
}

export function useDeleteReferralDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReferralDoctorApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralDoctors"] });
    },
  });
}

export function useRestoreReferralDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreReferralDoctorApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralDoctors"] });
    },
  });
}

export function useSetReferralDoctorStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) =>
      setReferralDoctorStatusApi(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["referralDoctors"] });
      const previous = queryClient.getQueriesData({ queryKey: ["referralDoctors"] });
      queryClient.setQueriesData<
        { rows: { id: string; status: boolean }[]; total: number } | undefined
      >(
        { queryKey: ["referralDoctors"] },
        (data) =>
          data && {
            ...data,
            rows: data.rows.map((row) => (row.id === id ? { ...row, status } : row)),
          },
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["referralDoctors"] });
    },
  });
}

export function useAssignReferralDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, marketingStaffId }: { id: string; marketingStaffId: string }) =>
      assignReferralDoctorApi(id, marketingStaffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralDoctors"] });
    },
  });
}

export function useBulkAssignReferralDoctors() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      doctorIds,
      marketingStaffId,
    }: {
      doctorIds: string[];
      marketingStaffId: string;
    }) => bulkAssignReferralDoctorsApi(doctorIds, marketingStaffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referralDoctors"] });
    },
  });
}

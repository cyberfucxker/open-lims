import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createOrganizationApi,
  deleteOrganizationApi,
  disableLoginApi,
  enableLoginApi,
  fetchOrganization,
  fetchOrganizationAuditLogs,
  fetchOrganizations,
  restoreOrganizationApi,
  setOrganizationStatusApi,
  updateLoginApi,
  updateOrganizationApi,
} from "@/services/api/organization.api";
import type {
  EnableLoginValues,
  ListOrganizationsParams,
  OrganizationFormValues,
  UpdateLoginValues,
} from "@/types/organization";

export function useOrganizations(params: ListOrganizationsParams = {}) {
  return useQuery({
    queryKey: ["organizations", params],
    queryFn: () => fetchOrganizations(params),
    placeholderData: (prev) => prev,
  });
}

export function useOrganization(id: string | undefined) {
  return useQuery({
    queryKey: ["organizations", "detail", id],
    queryFn: () => fetchOrganization(id as string),
    enabled: !!id,
  });
}

export function useOrganizationAuditLogs(id: string | undefined) {
  return useQuery({
    queryKey: ["organizations", "audit-logs", id],
    queryFn: () => fetchOrganizationAuditLogs(id as string),
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: OrganizationFormValues) => createOrganizationApi(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: OrganizationFormValues }) =>
      updateOrganizationApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrganizationApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useRestoreOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreOrganizationApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useSetOrganizationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setOrganizationStatusApi(id, active),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: ["organizations"] });
      const previous = queryClient.getQueriesData({ queryKey: ["organizations"] });
      queryClient.setQueriesData<
        { rows: { id: string; active: boolean }[]; total: number } | undefined
      >(
        { queryKey: ["organizations"] },
        (data) =>
          data && {
            ...data,
            rows: data.rows.map((row) => (row.id === id ? { ...row, active } : row)),
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
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useEnableOrganizationLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: EnableLoginValues }) =>
      enableLoginApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useUpdateOrganizationLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UpdateLoginValues }) =>
      updateLoginApi(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useDisableOrganizationLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => disableLoginApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

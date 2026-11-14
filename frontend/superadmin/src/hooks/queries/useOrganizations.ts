import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createOrganizationApi,
  deleteOrganizationApi,
  disableOrganizationLoginApi,
  enableOrganizationLoginApi,
  fetchCityOptions,
  fetchOrganization,
  fetchOrganizations,
  fetchOrganizationServiceAreas,
  fetchPriceListOptions,
  setOrganizationServiceAreasApi,
  setOrganizationStatusApi,
  updateOrganizationApi,
  updateOrganizationLoginApi,
  type EnableOrganizationLoginInput,
  type ListOrganizationsParams,
  type OrganizationFormValues,
} from "@/services/api/organizationApi";

export function useOrganizations(params: ListOrganizationsParams) {
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

export function usePriceListOptions() {
  return useQuery({
    queryKey: ["price-lists", "options"],
    queryFn: fetchPriceListOptions,
  });
}

export function useCityOptions() {
  return useQuery({
    queryKey: ["cities", "options"],
    queryFn: fetchCityOptions,
    staleTime: 5 * 60 * 1000,
  });
}

function useInvalidateOrganizations() {
  const queryClient = useQueryClient();
  return (id: string) => {
    queryClient.invalidateQueries({ queryKey: ["organizations"] });
    queryClient.invalidateQueries({ queryKey: ["organizations", "detail", id] });
  };
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: OrganizationFormValues) => createOrganizationApi(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organizations"] }),
  });
}

export function useUpdateOrganization() {
  const invalidate = useInvalidateOrganizations();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<OrganizationFormValues> }) =>
      updateOrganizationApi(id, values),
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrganizationApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organizations"] }),
  });
}

export function useSetOrganizationStatus() {
  const invalidate = useInvalidateOrganizations();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setOrganizationStatusApi(id, active),
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
}

export function useEnableOrganizationLogin() {
  const invalidate = useInvalidateOrganizations();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EnableOrganizationLoginInput }) =>
      enableOrganizationLoginApi(id, input),
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
}

export function useUpdateOrganizationLogin() {
  const invalidate = useInvalidateOrganizations();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { isActive?: boolean; password?: string } }) =>
      updateOrganizationLoginApi(id, input),
    onSuccess: (_data, variables) => invalidate(variables.id),
  });
}

export function useDisableOrganizationLogin() {
  const invalidate = useInvalidateOrganizations();
  return useMutation({
    mutationFn: (id: string) => disableOrganizationLoginApi(id),
    onSuccess: (_data, id) => invalidate(id),
  });
}

export function useOrganizationServiceAreas(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["organizations", "service-areas", organizationId],
    queryFn: () => fetchOrganizationServiceAreas(organizationId as string),
    enabled: !!organizationId,
  });
}

export function useSetOrganizationServiceAreas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, areaIds }: { id: string; areaIds: string[] }) =>
      setOrganizationServiceAreasApi(id, areaIds),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ["organizations", "service-areas", variables.id] }),
  });
}

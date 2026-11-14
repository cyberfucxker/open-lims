import { useQuery } from "@tanstack/react-query";

import {
  fetchCategories,
  fetchDepartments,
  fetchSampleTypes,
  type MasterDataListParams,
} from "@/services/api/masterDataApi";

export function useDepartments(params: MasterDataListParams = {}) {
  return useQuery({
    queryKey: ["departments", params],
    queryFn: () => fetchDepartments(params),
    placeholderData: (prev) => prev,
  });
}

export function useCategories(params: MasterDataListParams & { departmentId?: string } = {}) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => fetchCategories(params),
    placeholderData: (prev) => prev,
  });
}

export function useSampleTypes(params: MasterDataListParams = {}) {
  return useQuery({
    queryKey: ["sample-types", params],
    queryFn: () => fetchSampleTypes(params),
    placeholderData: (prev) => prev,
  });
}

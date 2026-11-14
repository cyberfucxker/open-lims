import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchHomeSeoContent,
  updateHomeSeoContentApi,
  type HomeSeoContentFormValues,
} from "@/services/api/homeSeoContentApi";

export function useHomeSeoContent() {
  return useQuery({
    queryKey: ["home-seo-content"],
    queryFn: fetchHomeSeoContent,
  });
}

export function useUpdateHomeSeoContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: HomeSeoContentFormValues) => updateHomeSeoContentApi(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["home-seo-content"] }),
  });
}

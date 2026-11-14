import { useQuery } from "@tanstack/react-query";
import { masterApi, type ListCitiesParams } from "@/services/api/masterApi";

export function useCities(params?: ListCitiesParams) {
  return useQuery({
    queryKey: ["cities", params ?? null],
    queryFn: () => masterApi.cities(params),
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
  });
}

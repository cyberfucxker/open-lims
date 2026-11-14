import { useQuery } from "@tanstack/react-query";

import { fetchGlobalSearch } from "@/services/api/searchApi";

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["globalSearch", query],
    queryFn: () => fetchGlobalSearch(query),
    enabled: query.trim().length > 1,
    placeholderData: (prev) => prev,
  });
}

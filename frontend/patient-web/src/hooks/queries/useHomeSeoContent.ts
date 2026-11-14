import { useQuery } from "@tanstack/react-query";
import { getHomeSeoContent } from "@/services/api/homeContentApi";

export function useHomeSeoContent() {
  return useQuery({
    queryKey: ["home-seo-content"],
    queryFn: getHomeSeoContent,
    staleTime: 5 * 60 * 1000,
  });
}

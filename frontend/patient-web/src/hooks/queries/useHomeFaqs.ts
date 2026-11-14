import { useQuery } from "@tanstack/react-query";
import { getHomeFaqs } from "@/services/api/homeContentApi";

export function useHomeFaqs() {
  return useQuery({
    queryKey: ["home-faqs"],
    queryFn: getHomeFaqs,
    staleTime: 5 * 60 * 1000,
  });
}

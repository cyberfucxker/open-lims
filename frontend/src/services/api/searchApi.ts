import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { GlobalSearchResult } from "@/types/search";

export async function fetchGlobalSearch(q: string): Promise<GlobalSearchResult> {
  const response = await httpClient.get<ApiResponseBody<GlobalSearchResult>>("/search", {
    params: { q },
    suppressErrorToast: true,
  });
  return response.data.data as GlobalSearchResult;
}

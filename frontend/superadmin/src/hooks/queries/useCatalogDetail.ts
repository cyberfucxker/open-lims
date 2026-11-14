import { useQuery } from "@tanstack/react-query";

import { fetchPackageDetail, fetchTestDetail } from "@/services/api/catalogDetailApi";

/** Read-only publish-preview queries. Keyed separately from `["tests"]` /
 *  `["packages"]` because they're a different projection of the same row — but
 *  the catalogue mutations invalidate these prefixes too (see
 *  `useParameters.ts#useCatalogInvalidation` and the Test/Package hooks), so an
 *  edit is reflected in an open preview. */

export function useTestDetail(id: string | null) {
  return useQuery({
    queryKey: ["test-detail", id],
    queryFn: () => fetchTestDetail(id as string),
    enabled: !!id,
  });
}

export function usePackageDetail(id: string | null) {
  return useQuery({
    queryKey: ["package-detail", id],
    queryFn: () => fetchPackageDetail(id as string),
    enabled: !!id,
  });
}

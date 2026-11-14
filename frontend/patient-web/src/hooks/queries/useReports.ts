import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { reportApi } from "@/mocks/api";

export const REPORTS_QUERY_KEY = ["reports"];

/** Phase 2: swap the `@/mocks/api` import above for `@/services/api` — the hook
 *  signatures below stay identical since both expose the same function shapes. */
export function useReports() {
  return useQuery({ queryKey: REPORTS_QUERY_KEY, queryFn: reportApi.list });
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: (id: string) => reportApi.download(id),
    onSuccess: (url) => {
      if (url) {
        toast.success("Report downloading...");
        window.open(url, "_blank");
      } else {
        toast.error("Report is not ready yet");
      }
    },
    onError: () => toast.error("Could not download report"),
  });
}

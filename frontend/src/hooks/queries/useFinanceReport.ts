import { useQuery } from "@tanstack/react-query";

import { fetchFinanceReport } from "@/services/api/financeReportApi";
import type { FinanceReportFilters } from "@/types/financeReport";

export function useFinanceReport(filters: FinanceReportFilters) {
  return useQuery({
    queryKey: ["finance-report", filters],
    queryFn: () => fetchFinanceReport(filters),
    placeholderData: (prev) => prev,
  });
}

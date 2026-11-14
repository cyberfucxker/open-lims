import { delay } from "../delay";
import { MOCK_REPORTS } from "../data/reports";
import type { ReportListItem } from "@/types";

export const reportApi = {
  async list(): Promise<ReportListItem[]> {
    return delay([...MOCK_REPORTS]);
  },

  async download(id: string): Promise<string> {
    const report = MOCK_REPORTS.find((r) => r.id === id);
    return delay(report?.reportUrl ?? "", 400);
  },
};

import { delay } from "../delay";
import type { ReportIssueRequest, SupportTicket } from "@/types";

export const supportApi = {
  async list(): Promise<SupportTicket[]> {
    return delay([]);
  },

  async reportIssue(_payload: ReportIssueRequest): Promise<null> {
    return delay(null, 600);
  },
};

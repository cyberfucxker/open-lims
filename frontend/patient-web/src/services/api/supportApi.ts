import { httpClient } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type { ReportIssueRequest, SupportTicket } from "@/types";

/** Real replacement for `mocks/api/supportApi.ts` — matches
 *  `GET /user/my-issues`, `POST /user/report-issue` (multipart; the screenshot
 *  field is optional, the backend accepts a ticket with none). */
export const supportApi = {
  async list(): Promise<SupportTicket[]> {
    const response =
      await httpClient.get<AppApiResponseBody<{ total: number; data: SupportTicket[] }>>(
        "/user/my-issues",
      );
    return response.data.data?.data ?? [];
  },

  async reportIssue(payload: ReportIssueRequest): Promise<null> {
    const form = new FormData();
    form.append("subject", payload.subject);
    form.append("description", payload.description);
    form.append("type", payload.type);
    if (payload.screenshot) form.append("screenshot", payload.screenshot);

    await httpClient.post("/user/report-issue", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return null;
  },
};

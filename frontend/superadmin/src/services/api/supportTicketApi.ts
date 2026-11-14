import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody, PaginatedResult } from "@/types/api";

export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";

/** Mirrors the backend's `SupportTicketDto` (GET /support-tickets) — a patient app
 *  Help Center issue submitted via `/api/v1/app/user/report-issue`. */
export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  screenshotUrl: string | null;
  status: SupportTicketStatus;
  customerId: string;
  customerName: string;
  customerMobile: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketListParams {
  search?: string;
  status?: SupportTicketStatus;
  page?: number;
  pageSize?: number;
}

export async function fetchSupportTickets(
  params: SupportTicketListParams = {},
): Promise<PaginatedResult<SupportTicket>> {
  const response = await httpClient.get<ApiResponseBody<PaginatedResult<SupportTicket>>>(
    "/support-tickets",
    { params, suppressErrorToast: true },
  );
  return response.data.data as PaginatedResult<SupportTicket>;
}

export async function setSupportTicketStatusApi(
  id: string,
  status: SupportTicketStatus,
): Promise<SupportTicket> {
  const response = await httpClient.patch<ApiResponseBody<SupportTicket>>(
    `/support-tickets/${id}/status`,
    { status },
    { suppressErrorToast: true },
  );
  return response.data.data as SupportTicket;
}

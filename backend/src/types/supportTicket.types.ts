export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";

export interface SupportTicketDto {
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

export interface ListSupportTicketsParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface ListSupportTicketsResult {
  rows: SupportTicketDto[];
  total: number;
}

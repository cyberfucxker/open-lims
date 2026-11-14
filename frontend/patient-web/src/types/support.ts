export type TicketStatus = "open" | "in_progress" | "closed";
export type TicketType = "complaint" | "feedback";

export interface SupportTicket {
  id: string;
  ticket_id: string;
  subject: string;
  description: string;
  screenshot: string | null;
  type: TicketType | null;
  status: TicketStatus;
  status_label: "Open" | "In Progress" | "Closed";
  created_at: string;
}

export interface ReportIssueRequest {
  subject: string;
  description: string;
  screenshot: File | null;
  type: TicketType;
}

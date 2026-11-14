import type { SupportTicketType } from "@prisma/client";
import { prisma } from "../../config/database";
import { nextTicketNumber } from "../../utils/idGenerator";

function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function listMyIssues(appUserId: string) {
  const tickets = await prisma.supportTicket.findMany({
    where: { appUserId },
    orderBy: { createdAt: "desc" },
  });

  return {
    total: tickets.length,
    data: tickets.map((t) => ({
      id: t.id,
      ticket_id: t.ticketNumber,
      subject: t.subject,
      description: t.description,
      screenshot: t.screenshotUrl,
      type: t.type ? t.type.toLowerCase() : null,
      status: t.status.toLowerCase(),
      status_label: statusLabel(t.status),
      created_at: t.createdAt.toISOString(),
    })),
  };
}

export interface ReportIssueInput {
  subject: string;
  description: string;
  /** Optional — omitted by any client that predates the Feedback screen's
   *  Complaint/Feedback picker. */
  type?: "complaint" | "feedback";
}

/** `screenshotUrl` is null when the patient didn't attach one — the column
 *  has always been nullable, and `listMyIssues` already returns
 *  `screenshot: null` for those. */
export async function reportIssue(
  appUserId: string,
  input: ReportIssueInput,
  screenshotUrl: string | null,
): Promise<void> {
  const ticketNumber = await nextTicketNumber();

  await prisma.supportTicket.create({
    data: {
      appUserId,
      ticketNumber,
      subject: input.subject,
      description: input.description,
      screenshotUrl,
      type: input.type?.toUpperCase() as SupportTicketType | undefined,
    },
  });
}

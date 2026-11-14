import type { AppUser, Prisma, SupportTicket } from "@prisma/client";
import { prisma } from "../config/database";
import type { SupportTicketDto, SupportTicketStatus } from "../types/supportTicket.types";

type SupportTicketWithUser = SupportTicket & { appUser: AppUser };

export interface ListSupportTicketsFilter {
  search?: string;
  status?: string;
  skip: number;
  take: number;
}

const TICKET_STATUSES = new Set(["OPEN", "IN_PROGRESS", "CLOSED"]);

/** Maps a Prisma row to the exact shape the frontend expects. */
export function toSupportTicketDto(ticket: SupportTicketWithUser): SupportTicketDto {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    description: ticket.description,
    screenshotUrl: ticket.screenshotUrl,
    status: ticket.status,
    customerId: ticket.appUserId,
    customerName: ticket.appUser.name ?? ticket.appUser.mobile,
    customerMobile: ticket.appUser.mobile,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListSupportTicketsFilter, "search" | "status">,
): Prisma.SupportTicketWhereInput {
  const where: Prisma.SupportTicketWhereInput = {};

  if (filter.search) {
    where.OR = [
      { ticketNumber: { contains: filter.search, mode: "insensitive" } },
      { subject: { contains: filter.search, mode: "insensitive" } },
      { appUser: { name: { contains: filter.search, mode: "insensitive" } } },
      { appUser: { mobile: { contains: filter.search, mode: "insensitive" } } },
    ];
  }
  if (filter.status && TICKET_STATUSES.has(filter.status)) {
    where.status = filter.status as SupportTicketStatus;
  }

  return where;
}

export async function listSupportTickets(
  filter: ListSupportTicketsFilter,
): Promise<{ rows: SupportTicketWithUser[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: { appUser: true },
      orderBy: { createdAt: "desc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return { rows, total };
}

export function findSupportTicketById(id: string) {
  return prisma.supportTicket.findUnique({ where: { id }, include: { appUser: true } });
}

export function updateSupportTicketStatus(id: string, status: SupportTicketStatus) {
  return prisma.supportTicket.update({
    where: { id },
    data: { status },
    include: { appUser: true },
  });
}

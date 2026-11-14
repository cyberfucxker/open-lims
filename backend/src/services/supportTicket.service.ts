import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as supportTicketRepository from "../repositories/supportTicket.repository";
import { toSupportTicketDto } from "../repositories/supportTicket.repository";
import type {
  ListSupportTicketsParams,
  ListSupportTicketsResult,
  SupportTicketDto,
  SupportTicketStatus,
} from "../types/supportTicket.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Support ticket not found");
    }
    throw error;
  }
}

export async function listSupportTickets(
  params: ListSupportTicketsParams,
): Promise<ListSupportTicketsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await supportTicketRepository.listSupportTickets({
    search: params.search,
    status: params.status,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toSupportTicketDto), total };
}

export async function getSupportTicket(id: string): Promise<SupportTicketDto> {
  const ticket = await supportTicketRepository.findSupportTicketById(id);
  if (!ticket) {
    throw ApiError.notFound("Support ticket not found");
  }
  return toSupportTicketDto(ticket);
}

export async function setSupportTicketStatus(
  id: string,
  status: SupportTicketStatus,
): Promise<SupportTicketDto> {
  const ticket = await withTranslatedErrors(() =>
    supportTicketRepository.updateSupportTicketStatus(id, status),
  );
  return toSupportTicketDto(ticket);
}

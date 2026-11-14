import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as supportTicketService from "../services/supportTicket.service";
import type { ListSupportTicketsParams, SupportTicketStatus } from "../types/supportTicket.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, page, pageSize } = req.query as Record<string, string | undefined>;

  const params: ListSupportTicketsParams = {
    search,
    status,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await supportTicketService.listSupportTickets(params);

  res.status(200).json(ApiResponse.success("Support tickets retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await supportTicketService.getSupportTicket(req.params.id);

  res.status(200).json(ApiResponse.success("Support ticket retrieved successfully", ticket));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as { status: SupportTicketStatus };

  const ticket = await supportTicketService.setSupportTicketStatus(req.params.id, status);

  res.status(200).json(ApiResponse.success("Support ticket status updated successfully", ticket));
});

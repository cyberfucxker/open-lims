import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as billService from "../services/bill.service";
import type {
  AddPaymentInput,
  BillViewStatus,
  ListBillsParams,
  SendInvoiceInput,
} from "../types/bill.types";

/** ADMIN sees everything; a Collection Center portal user is always scoped
 *  to their own Organization's bills/invoices. */
function scopeOrganizationId(req: Request): string | undefined {
  return req.user?.role.toUpperCase() === "ADMIN" ? undefined : req.user?.organizationId;
}

function parseListParams(req: Request): ListBillsParams {
  const { view, search, dateFrom, dateTo, emergency, sortBy, sortDir, page, pageSize } =
    req.query as Record<string, string | undefined>;

  return {
    view: view as BillViewStatus | undefined,
    search,
    dateFrom,
    dateTo,
    isEmergency: emergency === undefined ? undefined : emergency === "true",
    sortBy,
    sortDir: sortDir as ListBillsParams["sortDir"],
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await billService.listBills({
    ...parseListParams(req),
    organizationId: scopeOrganizationId(req),
  });
  res.status(200).json(ApiResponse.success("Bills retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const bill = await billService.getBillDetails(req.params.id, scopeOrganizationId(req));
  res.status(200).json(ApiResponse.success("Bill retrieved successfully", bill));
});

export const updateAdditionalCharges = asyncHandler(async (req: Request, res: Response) => {
  const { additionalCharges } = req.body as { additionalCharges: number };
  const bill = await billService.updateAdditionalCharges(req.params.id, additionalCharges);
  res.status(200).json(ApiResponse.success("Additional charges updated successfully", bill));
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const bill = await billService.cancelBill(req.params.id);
  res.status(200).json(ApiResponse.success("Bill cancelled successfully", bill));
});

export const markPrinted = asyncHandler(async (req: Request, res: Response) => {
  const bill = await billService.markBillPrinted(req.params.id);
  res.status(200).json(ApiResponse.success("Bill marked as printed", bill));
});

export const addPayment = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as AddPaymentInput;
  const bill = await billService.addPayment(req.params.id, input, req.user?.id ?? null);
  res.status(201).json(ApiResponse.success("Payment recorded successfully", bill));
});

export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const payments = await billService.listPayments(req.params.id);
  res.status(200).json(ApiResponse.success("Payment history retrieved successfully", payments));
});

export const sendInvoice = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as SendInvoiceInput;
  const bill = await billService.sendInvoice(req.params.id, input);
  res.status(200).json(ApiResponse.success("Invoice sent successfully", bill));
});

export const listSendHistory = asyncHandler(async (req: Request, res: Response) => {
  const logs = await billService.listSendHistory(req.params.id);
  res.status(200).json(ApiResponse.success("Send history retrieved successfully", logs));
});

export const downloadInvoicePdf = asyncHandler(async (req: Request, res: Response) => {
  const { buffer, billNo } = await billService.generatePdfForBill(
    req.params.id,
    scopeOrganizationId(req),
  );
  const disposition = req.query.disposition === "attachment" ? "attachment" : "inline";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${disposition}; filename="${billNo}.pdf"`);
  res.send(buffer);
});

export const exportExcel = asyncHandler(async (req: Request, res: Response) => {
  const buffer = await billService.exportBillsExcel(parseListParams(req));

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", 'attachment; filename="bills.xlsx"');
  res.send(buffer);
});

export const exportPdf = asyncHandler(async (req: Request, res: Response) => {
  const buffer = await billService.exportBillsPdf(parseListParams(req));

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="bills.pdf"');
  res.send(buffer);
});

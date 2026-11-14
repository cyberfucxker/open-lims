import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  AddPaymentInput,
  BillDetails,
  InvoiceSendLogRecord,
  ListBillsParams,
  ListBillsResult,
  PaymentRecord,
  SendInvoiceInput,
} from "@/types/bill";

export async function fetchBills(params: ListBillsParams = {}): Promise<ListBillsResult> {
  const response = await httpClient.get<ApiResponseBody<ListBillsResult>>("/bills", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as ListBillsResult;
}

export async function fetchBillDetails(id: string): Promise<BillDetails> {
  const response = await httpClient.get<ApiResponseBody<BillDetails>>(`/bills/${id}`, {
    suppressErrorToast: true,
  });
  return response.data.data as BillDetails;
}

export async function updateAdditionalChargesApi(
  id: string,
  additionalCharges: number,
): Promise<BillDetails> {
  const response = await httpClient.patch<ApiResponseBody<BillDetails>>(
    `/bills/${id}/additional-charges`,
    { additionalCharges },
    { suppressErrorToast: true },
  );
  return response.data.data as BillDetails;
}

export async function cancelBillApi(id: string): Promise<BillDetails> {
  const response = await httpClient.patch<ApiResponseBody<BillDetails>>(
    `/bills/${id}/cancel`,
    {},
    { suppressErrorToast: true },
  );
  return response.data.data as BillDetails;
}

export async function markBillPrintedApi(id: string): Promise<BillDetails> {
  const response = await httpClient.post<ApiResponseBody<BillDetails>>(
    `/bills/${id}/mark-printed`,
    {},
    { suppressErrorToast: true },
  );
  return response.data.data as BillDetails;
}

export async function addPaymentApi(id: string, input: AddPaymentInput): Promise<BillDetails> {
  const response = await httpClient.post<ApiResponseBody<BillDetails>>(
    `/bills/${id}/payments`,
    input,
    {
      suppressErrorToast: true,
    },
  );
  return response.data.data as BillDetails;
}

export async function fetchPayments(id: string): Promise<PaymentRecord[]> {
  const response = await httpClient.get<ApiResponseBody<PaymentRecord[]>>(`/bills/${id}/payments`, {
    suppressErrorToast: true,
  });
  return response.data.data as PaymentRecord[];
}

export async function sendInvoiceApi(id: string, input: SendInvoiceInput): Promise<BillDetails> {
  const response = await httpClient.post<ApiResponseBody<BillDetails>>(`/bills/${id}/send`, input, {
    suppressErrorToast: true,
  });
  return response.data.data as BillDetails;
}

export async function fetchSendHistory(id: string): Promise<InvoiceSendLogRecord[]> {
  const response = await httpClient.get<ApiResponseBody<InvoiceSendLogRecord[]>>(
    `/bills/${id}/send-history`,
    {
      suppressErrorToast: true,
    },
  );
  return response.data.data as InvoiceSendLogRecord[];
}

export async function fetchInvoicePdfBlob(id: string): Promise<Blob> {
  const response = await httpClient.get(`/bills/${id}/invoice-pdf`, {
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

export async function fetchBillsExcelBlob(params: ListBillsParams = {}): Promise<Blob> {
  const response = await httpClient.get("/bills/export/excel", {
    params,
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

export async function fetchBillsPdfBlob(params: ListBillsParams = {}): Promise<Blob> {
  const response = await httpClient.get("/bills/export/pdf", {
    params,
    responseType: "blob",
    suppressErrorToast: true,
  });
  return response.data as Blob;
}

/** Triggers a browser download for a blob response — shared by PDF/Excel export buttons. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

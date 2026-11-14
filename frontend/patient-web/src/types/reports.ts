export type ReportOrderStatus = "pending" | "processing" | "ready";

export interface ReportListItem {
  id: string;
  reportId: string;
  orderId: string | null;
  testName: string;
  bookingDate: string;
  orderStatus: ReportOrderStatus;
  reportUrl: string | null;
}

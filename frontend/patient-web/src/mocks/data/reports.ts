import type { ReportListItem } from "@/types";

export const MOCK_REPORTS: ReportListItem[] = [
  {
    id: "report_1",
    reportId: "RPT-9001",
    orderId: "order_1001",
    testName: "Full Body Checkup - Advanced",
    bookingDate: "2026-07-20T09:00:00.000Z",
    orderStatus: "ready",
    reportUrl: "/api/v1/app/user/reports/report_1/download",
  },
  {
    id: "report_2",
    reportId: "RPT-9002",
    orderId: "order_1002",
    testName: "Diabetes Care Package",
    bookingDate: "2026-08-02T10:00:00.000Z",
    orderStatus: "processing",
    reportUrl: null,
  },
];

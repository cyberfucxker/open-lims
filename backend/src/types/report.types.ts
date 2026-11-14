import type { AppointmentPatientSummary } from "./appointment.types";

export type ReportStatus =
  | "PENDING"
  | "RECEIVED"
  | "PROCESSING"
  | "PARTIAL"
  | "APPROVED"
  | "SUBMITTED"
  | "PRINTED"
  | "CANCELLED";

/** Query-time tab filter only — never stored. See `report.repository.ts#applyViewFilter`. */
export type ReportViewStatus =
  | "all"
  | "pending"
  | "received"
  | "processing"
  | "partial"
  | "approved"
  | "submitted"
  | "printed"
  | "cancelled";

export type ResultFlag = "NORMAL" | "LOW" | "HIGH" | "CRITICAL_LOW" | "CRITICAL_HIGH";

/** Per-test workflow, independent per `ReportTestResult` row — see the
 *  `TestReportStatus` Prisma enum doc-comment. */
export type TestReportStatus =
  "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PRINTED";

export interface ReportParameterResultLine {
  id: string;
  parameterId: string;
  name: string;
  shortCode: string | null;
  unit: string | null;
  referenceRangeText: string | null;
  resultValue: string | null;
  machineValue: string | null;
  flag: ResultFlag;
  highlight: boolean;
}

export interface ReportResultLine {
  id: string;
  appointmentTestId: string;
  testId: string;
  testName: string;
  testShortName: string;
  departmentName: string;
  sampleId: string | null;
  sampleNo: string | null;
  sampleStatus: string | null;
  resultValue: string | null;
  unit: string | null;
  referenceRange: string | null;
  method: string | null;
  remarks: string | null;
  flag: ResultFlag;
  isCritical: boolean;
  enteredByUserId: string | null;
  enteredBy?: string | null;
  enteredAt: string | null;
  status: TestReportStatus;
  submittedAt: string | null;
  approvedByUserId: string | null;
  approvedBy?: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  printedAt: string | null;
  signatoryIds: string[];
  parameters: ReportParameterResultLine[];
}

export interface ReportTestSummary {
  testId: string;
  testName: string;
}

/** Per-test row shown on the "Generate Reports" screen — one per ordered
 *  test on the bill, each with its own status/sample gate, independent of
 *  the whole-Report rollup status. */
export interface ReportTestResultSummary {
  resultId: string;
  testId: string;
  testName: string;
  testShortName: string;
  status: TestReportStatus;
  sampleId: string | null;
  sampleStatus: string | null;
  sampleNo: string | null;
}

export interface ReportListItem {
  id: string;
  reportNo: string;
  appointmentId: string;
  appointmentNo: string;
  billNo: string | null;
  patient: AppointmentPatientSummary;
  status: ReportStatus;
  isEmergency: boolean;
  tests: ReportTestSummary[];
  testResults: ReportTestResultSummary[];
  enteredByUserId: string | null;
  enteredBy?: string | null;
  enteredAt: string | null;
  approvedByUserId: string | null;
  approvedBy?: string | null;
  approvedAt: string | null;
  submittedAt: string | null;
  printCount: number;
  lastPrintedAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDetails extends ReportListItem {
  results: ReportResultLine[];
}

export interface ReportViewCounts {
  all: number;
  pending: number;
  received: number;
  processing: number;
  partial: number;
  approved: number;
  submitted: number;
  printed: number;
  cancelled: number;
}

export interface ListReportsParams {
  view?: ReportViewStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  isEmergency?: boolean;
  /** Forced to the caller's own Organization for a Collection Center portal
   *  caller — never taken from the query string in that case. */
  organizationId?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListReportsResult {
  rows: ReportListItem[];
  total: number;
  counts: ReportViewCounts;
}

export interface SaveResultLineInput {
  appointmentTestId: string;
  resultValue?: string | null;
  unit?: string | null;
  referenceRange?: string | null;
  method?: string | null;
  remarks?: string | null;
  flag?: ResultFlag;
  isCritical?: boolean;
}

export interface SaveResultsInput {
  results: SaveResultLineInput[];
}

export interface SaveParameterResultInput {
  id: string;
  resultValue?: string | null;
  machineValue?: string | null;
  flag?: ResultFlag;
  highlight?: boolean;
}

export interface SaveTestResultInput {
  resultValue?: string | null;
  unit?: string | null;
  referenceRange?: string | null;
  method?: string | null;
  remarks?: string | null;
  flag?: ResultFlag;
  isCritical?: boolean;
  autoCalculate?: boolean;
  parameters?: SaveParameterResultInput[];
}

export interface ApproveTestResultInput {
  signatoryIds: string[];
}

export interface RejectTestResultInput {
  reason: string;
}

export interface RejectReportInput {
  reason: string;
}

export interface CancelReportInput {
  reason: string;
}

export interface ReportAuditLogRecord {
  id: string;
  action: string;
  performedByUserId: string | null;
  performedBy?: string | null;
  note: string | null;
  createdAt: string;
}

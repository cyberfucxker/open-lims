import type { AppointmentPatientSummary } from "./appointment.types";

export type SampleStatus =
  "PENDING" | "COLLECTED" | "RECEIVED" | "APPROVED" | "REJECTED" | "PROCESSING" | "COMPLETED";
/** Query-time tab filter only — never stored. See `sample.repository.ts#applyViewFilter`. */
export type SampleViewStatus =
  "all" | "pending" | "collected" | "received" | "approved" | "rejected" | "completed";

export interface SampleTestLine {
  testId: string;
  testName: string;
  testShortName: string;
}

export interface SampleRecord {
  id: string;
  sampleNo: string;
  appointmentId: string;
  appointmentNo: string;
  patient: AppointmentPatientSummary;
  sampleTypeId: string;
  sampleType: string;
  containerId: string | null;
  containerName: string | null;
  containerColor: string | null;
  status: SampleStatus;
  isEmergency: boolean;
  tests: SampleTestLine[];
  collectedAt: string | null;
  collectedByUserId: string | null;
  collectedBy?: string | null;
  receivedAt: string | null;
  receivedByUserId: string | null;
  receivedBy?: string | null;
  approvedAt: string | null;
  approvedByUserId: string | null;
  approvedBy?: string | null;
  rejectedAt: string | null;
  rejectedByUserId: string | null;
  rejectedBy?: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SampleViewCounts {
  all: number;
  pending: number;
  collected: number;
  received: number;
  approved: number;
  rejected: number;
  completed: number;
}

export interface ListSamplesParams {
  view?: SampleViewStatus;
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

export interface ListSamplesResult {
  rows: SampleRecord[];
  total: number;
  counts: SampleViewCounts;
}

export interface RejectSampleInput {
  reason: string;
}

export interface BulkSampleIdsInput {
  ids: string[];
}

export interface BulkActionFailure {
  id: string;
  reason: string;
}

export interface BulkActionResult {
  succeeded: string[];
  failed: BulkActionFailure[];
}

export interface SampleStatusLogRecord {
  id: string;
  fromStatus: SampleStatus | null;
  toStatus: SampleStatus;
  performedByUserId: string | null;
  performedBy?: string | null;
  note: string | null;
  createdAt: string;
}

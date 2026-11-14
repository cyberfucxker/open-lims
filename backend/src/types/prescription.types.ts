export type PrescriptionStatus = "SUBMITTED" | "APPROVED" | "REJECTED";

export interface PrescriptionDto {
  id: string;
  /** Who the prescription is FOR — the family member it was filed against.
   *  Null for a row whose family member was deleted after submission
   *  (`onDelete: SetNull`), which is why the account holder is carried
   *  separately below: there is always someone to call back. */
  patientName: string | null;
  patientMobile: string | null;
  relation: string | null;
  /** The account that uploaded it. Never null. */
  customerId: string;
  customerName: string;
  customerMobile: string;
  cityId: string | null;
  cityName: string | null;
  query: string | null;
  fileUrl: string;
  status: PrescriptionStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListPrescriptionsParams {
  search?: string;
  status?: string;
  cityId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListPrescriptionsResult {
  rows: PrescriptionDto[];
  total: number;
  /** Count per status across the WHOLE filtered set minus the status filter
   *  itself, so the tabs can show totals that don't collapse to the tab you
   *  are already standing on. */
  statusCounts: Record<PrescriptionStatus, number>;
}

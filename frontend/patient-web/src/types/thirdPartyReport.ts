export interface ThirdPartyReportItem {
  userId: string;
  testRegnId: number;
  amountPaid: number;
  patientName: string;
  patientMobile: string;
  balanceAmt: number;
  labCode: string;
  /** Empty string when the report hasn't been released yet. */
  pdfUrl: string;
}

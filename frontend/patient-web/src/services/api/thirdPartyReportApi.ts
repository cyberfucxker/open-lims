import { httpClient } from "./httpClient";
import type { AppApiResponseBody } from "@/types/common";
import type { ThirdPartyReportItem } from "@/types";

/** Wire shape from `POST /fetch-third-party-report` — kept PascalCase to
 *  match the backend's ThirdPartyReport module exactly; mapped to this
 *  app's camelCase convention in toReportItem() below. */
interface ThirdPartyReportRecordDto {
  UserID: string;
  TestRegnID: number;
  AmountPaid: number;
  PatientName: string;
  PatientMobile: string;
  BalanceAmt: number;
  LabCode: string;
  PDFFileName: string;
}

function toReportItem(dto: ThirdPartyReportRecordDto): ThirdPartyReportItem {
  return {
    userId: dto.UserID,
    testRegnId: dto.TestRegnID,
    amountPaid: dto.AmountPaid,
    patientName: dto.PatientName,
    patientMobile: dto.PatientMobile,
    balanceAmt: dto.BalanceAmt,
    labCode: dto.LabCode,
    pdfUrl: dto.PDFFileName,
  };
}

/** Matches the backend's ThirdPartyReport module (`/third-party-send-otp`,
 *  `/third-party-verify-otp`, `/fetch-third-party-report`) — bridges the
 *  third-party partner lab's own report list into this app. */
export const thirdPartyReportApi = {
  async sendOtp(mobile: string): Promise<{ devOtp?: string }> {
    const response = await httpClient.post<AppApiResponseBody<{ devOtp?: string } | null>>(
      "/third-party-send-otp",
      { mobile },
    );
    return response.data.data ?? {};
  },

  async verifyOtp(mobile: string, otp: string): Promise<{ userFID: string }> {
    const response = await httpClient.post<AppApiResponseBody<{ userFID: string }>>(
      "/third-party-verify-otp",
      { mobile, otp },
    );
    return response.data.data as { userFID: string };
  },

  async fetchReports(userFID: string): Promise<ThirdPartyReportItem[]> {
    const response = await httpClient.post<
      AppApiResponseBody<{ reports: ThirdPartyReportRecordDto[] }>
    >("/fetch-third-party-report", { userFID });
    return (response.data.data?.reports ?? []).map(toReportItem);
  },

  /** Streamed straight from our own server (`Content-Disposition: attachment`)
   *  — never a direct link to the lab partner's host, which requires the
   *  partner's own web-session login and would otherwise just redirect an
   *  unauthenticated request to it. `responseType: "blob"` is what lets this
   *  go through `httpClient` (Bearer-authenticated) rather than a bare
   *  `<a href>` that couldn't attach the header at all.
   *
   *  Takes `userFID` (same id `fetchReports` already uses) rather than
   *  relying on the app-login session — linking a different mobile than the
   *  one logged into the app is a supported case (e.g. a family member's
   *  reports filed under their own number), so the backend can't gate this
   *  on the app session's mobile either. */
  async downloadReport(userFID: string, testRegnId: number): Promise<Blob> {
    const response = await httpClient.get(`/third-party-reports/${testRegnId}/download`, {
      params: { user_fid: userFID },
      responseType: "blob",
    });
    return response.data as Blob;
  },
};

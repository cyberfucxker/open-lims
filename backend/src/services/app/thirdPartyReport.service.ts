import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { issueOtp, verifyOtp } from "../otp.service";
import { ThirdPartyLabClient } from "./thirdPartyLabClient.service";
import type { ThirdPartyReportRecord } from "./thirdPartyLabClient.service";

const OTP_PURPOSE = "THIRD_PARTY_LAB_LOGIN" as const;

/** EXT-1 login, then stash the returned UserFID keyed by mobile so
 *  verifyThirdPartyOtp() can retrieve it once our own OTP is confirmed. */
export async function sendThirdPartyOtp(mobile: string): Promise<{ devOtp?: string }> {
  const userFid = await ThirdPartyLabClient.login(mobile);

  await prisma.thirdPartyLabSession.upsert({
    where: { mobile },
    update: { userFid },
    create: { mobile, userFid },
  });

  return issueOtp(mobile, OTP_PURPOSE);
}

export async function verifyThirdPartyOtp(mobile: string, otp: string): Promise<string> {
  await verifyOtp(mobile, otp, OTP_PURPOSE);

  const session = await prisma.thirdPartyLabSession.findUnique({ where: { mobile } });
  if (!session) {
    throw ApiError.badRequest("Session expired. Please request a new OTP.");
  }

  return session.userFid;
}

export async function fetchThirdPartyReports(userFid: string): Promise<ThirdPartyReportRecord[]> {
  return ThirdPartyLabClient.listReports(userFid);
}

/** Streams a released report's PDF bytes back through our own API — see
 *  `thirdPartyLabClient.service.ts#fetchReleasedReportPdf` (EXT-4,
 *  GetReleaseTestReport_Global) for the actual partner call, ported verbatim
 *  from the legacy PHP backend's `getPatientReport()`.
 *
 *  Keyed on `userFid`, same as `fetchThirdPartyReports`/`updateThirdPartyPaymentStatus`
 *  — NOT on the caller's own app-login mobile. Those two intentionally allow
 *  linking a *different* mobile than the one logged into the app (e.g.
 *  checking a family member's reports filed under their own number at the
 *  lab), so gating download on `req.appUser.mobile` instead just breaks for
 *  every such user with "Link your lab account first" even though they very
 *  much have. `userFid` only ever exists in `ThirdPartyLabSession` once
 *  someone has completed the OTP-verify for the mobile it belongs to — that
 *  is the ownership check here, matching the trust model the other two
 *  endpoints already use. (The legacy PHP version's download route had no
 *  ownership check at all — `GetReleaseTestReport_Global` itself only ever
 *  takes a bare `TestRegnID`, no identity — this is stricter than that.)
 *
 *  Also re-derives the report's balance server-side before allowing the
 *  download — the legacy PHP route didn't bother (it only ever gated
 *  "Download" vs "Pay Online" client-side, on the list page), but re-using
 *  the same list call we already have here is nearly free and closes that
 *  gap too. */
export async function downloadThirdPartyReport(
  userFid: string,
  testRegnId: number,
): Promise<Buffer> {
  const session = await prisma.thirdPartyLabSession.findFirst({ where: { userFid } });
  if (!session) {
    throw ApiError.badRequest("Link your lab account first.");
  }

  const reports = await ThirdPartyLabClient.listReports(userFid);
  const report = reports.find((r) => r.TestRegnID === testRegnId);
  if (!report) {
    throw ApiError.notFound("Report not found.");
  }
  if (report.BalanceAmt > 0) {
    throw ApiError.forbidden("Clear the balance on this report before downloading.");
  }

  return ThirdPartyLabClient.fetchReleasedReportPdf(testRegnId);
}

export interface UpdateThirdPartyPaymentInput {
  testRegnId: number;
  amountPaid: number;
  currentPayAmt: number;
  userId: string;
}

export async function updateThirdPartyPaymentStatus(
  input: UpdateThirdPartyPaymentInput,
): Promise<void> {
  const success = await ThirdPartyLabClient.updatePaymentStatus(input);
  if (!success) {
    throw ApiError.badRequest("Payment status update was rejected by the lab partner.");
  }
}

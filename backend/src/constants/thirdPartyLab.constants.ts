import { env } from "../config/env";

/**
 * Config for the optional third-party partner-lab integration
 * (ThirdPartyReport module). The endpoints and the partner-assigned lab id
 * come from the environment (THIRD_PARTY_LAB_*) — see `.env.example`. The
 * defaults below are inert placeholders on a reserved domain.
 */
const partnerOrigin = env.THIRD_PARTY_LAB_ORIGIN ?? "https://partner-lab.example.com";

export const THIRD_PARTY_LAB = {
  BASE_URL: env.THIRD_PARTY_LAB_BASE_URL ?? `${partnerOrigin}/Services/GlobalUserService.svc/`,
  /** GetReleaseTestReport_Global — the *only* verified way to actually get a
   *  report's PDF; ported from a legacy backend. Deliberately a different host from `BASE_URL`
   *  (this is `Test_RegnService.svc`, same host `PAYMENT_UPDATE_URL` uses) —
   *  the earlier attempt that reused `PDFFileName` from `TestReportList` and
   *  built a URL against `BASE_URL`'s host instead was wrong: that host
   *  gates every path behind the partner's own web-session login and just
   *  redirects an unauthenticated request to it, which is why that approach
   *  silently produced a broken (HTML, not PDF) download. */
  RELEASE_REPORT_URL: `${partnerOrigin}/Services/Test_RegnService.svc/GetReleaseTestReport_Global`,
  /** Origin the release call's `PdfName` resolves against (root of the same
   *  host, not the SOAP service path) — verified live: this host serves the
   *  actual file with no login redirect, unlike `BASE_URL`'s host. */
  RELEASE_REPORT_ORIGIN: partnerOrigin,
  /** Hardcoded literal in the legacy call, not partner-documented — kept as
   *  a named constant here rather than a bare `6` at the call site. */
  RELEASE_REPORT_USER_TYPE_ID: 6,
  PAYMENT_UPDATE_URL: `${partnerOrigin}/Services/Test_RegnService.svc/UpdateTestRegnBalAmt`,
  LAB_ID: env.THIRD_PARTY_LAB_ID ?? "00000000-0000-0000-0000-000000000000",
  TASK: 3,
  PAYMENT_METHOD_TYPE: "7",
} as const;

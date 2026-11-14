import axios from "axios";
import { THIRD_PARTY_LAB } from "../../constants/thirdPartyLab.constants";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../utils/logger";

const REQUEST_TIMEOUT_MS = 15000;

interface UserRegistrationResponse {
  Result: string;
  UserFID: string;
}

export interface ThirdPartyReportRecord {
  UserID: string;
  TestRegnID: number;
  AmountPaid: number;
  PatientName: string;
  PatientMobile: string;
  BalanceAmt: number;
  LabCode: string;
  PDFFileName: string;
}

export interface UpdatePaymentStatusInput {
  testRegnId: number;
  amountPaid: number;
  currentPayAmt: number;
  userId: string;
}

interface ReleaseTestReportRecord {
  PdfName: string;
}

function describeAxiosError(error: unknown) {
  return axios.isAxiosError(error)
    ? { message: error.message, status: error.response?.status, data: error.response?.data }
    : String(error);
}

/** Strips the ASP.NET virtual-root marker and any path-traversal sequences
 *  from a partner-supplied file path — ported verbatim from the legacy PHP
 *  backend's `str_replace(["../", "~"], "", $PdfName)` (global replace, not
 *  just a leading match), before it's ever used to build a fetch URL. */
function sanitizePartnerPath(path: string): string {
  return path.replaceAll("../", "").replaceAll("~", "");
}

/** Thin wrapper around the third-party partner's SOAP-over-JSON
 *  endpoints. Every method throws ApiError on failure — the partner's raw
 *  error shape/response is never exposed to our own API clients directly. */
export const ThirdPartyLabClient = {
  /** EXT-1: UserRegistration — logs the mobile number in on the partner
   *  system and returns its UserFID. */
  async login(mobile: string): Promise<string> {
    let response;
    try {
      response = await axios.post<{ d: UserRegistrationResponse }>(
        `${THIRD_PARTY_LAB.BASE_URL}UserRegistration`,
        {
          objSP: {
            UserName: mobile,
            Password: mobile,
            Task: THIRD_PARTY_LAB.TASK,
            AppID: THIRD_PARTY_LAB.LAB_ID,
          },
        },
        { timeout: REQUEST_TIMEOUT_MS },
      );
    } catch (error) {
      logger.error("Third-party lab login request failed", { error: describeAxiosError(error) });
      throw ApiError.internal("Unable to reach the lab partner service. Please try again.");
    }

    const result = response.data?.d;
    if (!result || result.Result !== "Success" || !result.UserFID) {
      logger.error("Third-party lab login rejected", { result });
      throw ApiError.badRequest("Unable to verify this mobile number with the lab partner.");
    }

    return result.UserFID;
  },

  /** EXT-2: TestReportList — fetches the report list for a UserFID. */
  async listReports(userFid: string): Promise<ThirdPartyReportRecord[]> {
    let response;
    try {
      response = await axios.post<{ d: ThirdPartyReportRecord[] }>(
        `${THIRD_PARTY_LAB.BASE_URL}TestReportList`,
        {
          UserFID: userFid,
          LabID: THIRD_PARTY_LAB.LAB_ID,
          FromDate: "",
          ToDate: "",
          LabCode: "",
          PatientName: "",
          UserType: "1",
          EntityId: 0,
          EntityTypeId: 0,
        },
        { timeout: REQUEST_TIMEOUT_MS },
      );
    } catch (error) {
      logger.error("Third-party lab report list request failed", {
        error: describeAxiosError(error),
      });
      throw ApiError.internal("Unable to fetch reports from the lab partner. Please try again.");
    }

    const records = response.data?.d ?? [];
    // The partner's TestReportList response doesn't actually include a
    // UserID field per record — echo back the UserFID the list was
    // requested with, per the spec's own "UserID (= UserFID)" note.
    //
    // PDFFileName stays a sanitised *relative* partner path here — NOT a
    // browser-facing URL. The app never links straight to the partner's raw
    // host (that page turned out to require the partner's own web-session
    // login and redirects an unauthenticated request to it); `fetchReportPdf`
    // below is what actually resolves it into a URL, and only our own
    // backend ever requests that URL, then streams the bytes to the app.
    return records.map((record) => ({
      UserID: userFid,
      TestRegnID: record.TestRegnID,
      AmountPaid: record.AmountPaid,
      PatientName: record.PatientName,
      PatientMobile: record.PatientMobile,
      BalanceAmt: record.BalanceAmt,
      LabCode: record.LabCode,
      // Informational only now (drives the READY/PROCESSING signal in the
      // app) — NOT what download actually fetches. This field's own value
      // turned out to point at a host that gates every path behind the
      // partner's web-session login (see `fetchReleasedReportPdf` below,
      // which is the verified, working path).
      PDFFileName: record.PDFFileName ? sanitizePartnerPath(record.PDFFileName) : "",
    }));
  },

  /** EXT-4: GetReleaseTestReport_Global, ported verbatim from the legacy PHP
   *  backend's `getPatientReport()` — the only verified way to actually get
   *  a report's PDF. Two GETs, both server-side (the browser never talks to
   *  the partner directly): first resolves `TestRegnID` to a `PdfName` on
   *  `Test_RegnService.svc` (a different host from `BASE_URL`/`listReports`,
   *  and — unlike that host — verified live to serve the file with no login
   *  redirect), then fetches that file's bytes. No UserFID goes into either
   *  call; ownership is enforced by our own caller (`thirdPartyReport.service.ts`)
   *  before this is ever reached, which the legacy PHP route didn't do at all. */
  async fetchReleasedReportPdf(testRegnId: number): Promise<Buffer> {
    let releaseResponse;
    try {
      releaseResponse = await axios.get<{ d: ReleaseTestReportRecord[] }>(
        THIRD_PARTY_LAB.RELEASE_REPORT_URL,
        {
          params: {
            LabID: THIRD_PARTY_LAB.LAB_ID,
            UserTypeID: THIRD_PARTY_LAB.RELEASE_REPORT_USER_TYPE_ID,
            TestRegnID: testRegnId,
          },
          timeout: REQUEST_TIMEOUT_MS,
        },
      );
    } catch (error) {
      logger.error("Third-party lab release-report request failed", {
        error: describeAxiosError(error),
      });
      throw ApiError.internal("Error retrieving data from the lab partner. Please try again.");
    }

    const record = releaseResponse.data?.d?.[0];
    if (!record) {
      throw ApiError.notFound("No data found for this report.");
    }
    if (!record.PdfName) {
      throw ApiError.notFound(
        "Your report is not ready yet. Please contact customer support at +91 98765 43210.",
      );
    }

    const fileUrl = `${THIRD_PARTY_LAB.RELEASE_REPORT_ORIGIN}/${sanitizePartnerPath(record.PdfName)}`;

    let buffer: Buffer;
    try {
      const fileResponse = await axios.get<ArrayBuffer>(fileUrl, {
        responseType: "arraybuffer",
        timeout: REQUEST_TIMEOUT_MS,
      });
      buffer = Buffer.from(fileResponse.data);
    } catch (error) {
      logger.error("Third-party lab report file fetch failed", {
        testRegnId,
        fileUrl,
        error: describeAxiosError(error),
      });
      throw ApiError.notFound(
        "Your report is not ready yet. Please contact customer support at +91 98765 43210.",
      );
    }

    // Belt-and-suspenders: real PDFs start with the "%PDF-" magic bytes. A
    // non-PDF response here (login page, error page, ...) fails loudly
    // instead of silently handing back a broken file labelled report.pdf.
    if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      logger.error("Third-party lab report fetch returned a non-PDF response", {
        testRegnId,
        fileUrl,
        preview: buffer.subarray(0, 200).toString("utf8"),
      });
      throw ApiError.internal(
        "The lab partner didn't return a valid report file. Please try again shortly, or contact support if this keeps happening.",
      );
    }

    return buffer;
  },

  /** EXT-3: UpdateTestRegnBalAmt — updates the payment status on the
   *  partner system. Returns the partner's boolean result as-is; callers
   *  decide whether `false` should surface as an error. */
  async updatePaymentStatus(input: UpdatePaymentStatusInput): Promise<boolean> {
    let response;
    try {
      response = await axios.post<{ d: boolean }>(
        THIRD_PARTY_LAB.PAYMENT_UPDATE_URL,
        {
          objBillRecieptClass: {
            TestRegnID: input.testRegnId,
            AmountPaid: input.amountPaid,
            CurrentPayAmt: input.currentPayAmt,
            Task: THIRD_PARTY_LAB.TASK,
            PaymentMethodType: THIRD_PARTY_LAB.PAYMENT_METHOD_TYPE,
            UserID: input.userId,
            LabID: THIRD_PARTY_LAB.LAB_ID,
          },
        },
        { timeout: REQUEST_TIMEOUT_MS },
      );
    } catch (error) {
      logger.error("Third-party lab payment update request failed", {
        error: describeAxiosError(error),
      });
      throw ApiError.internal(
        "Unable to update payment status with the lab partner. Please try again.",
      );
    }

    return response.data?.d === true;
  },
};

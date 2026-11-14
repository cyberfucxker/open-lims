import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { AppApiResponse } from "../../utils/AppApiResponse";
import * as thirdPartyReportService from "../../services/app/thirdPartyReport.service";

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { mobile } = req.body as { mobile: string };

  const devFields = await thirdPartyReportService.sendThirdPartyOtp(mobile);

  res
    .status(200)
    .json(AppApiResponse.success("OTP sent", Object.keys(devFields).length ? devFields : null));
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { mobile, otp } = req.body as { mobile: string; otp: string };

  const userFID = await thirdPartyReportService.verifyThirdPartyOtp(mobile, otp);

  res.status(200).json(AppApiResponse.success("OTP verified successfully", { userFID }));
});

export const fetchReports = asyncHandler(async (req: Request, res: Response) => {
  const { userFID } = req.body as { userFID: string };

  const reports = await thirdPartyReportService.fetchThirdPartyReports(userFID);

  res.status(200).json(AppApiResponse.success("Reports fetched successfully", { reports }));
});

/** Streams the PDF back with `Content-Disposition: attachment` — our own
 *  server is the only thing that ever talks to the partner's file host now.
 *  Keyed on `user_fid` (query param), same identity `fetchReports`/
 *  `updatePaymentStatus` already trust — see the doc comment on
 *  `thirdPartyReportService.downloadThirdPartyReport` for why this can't be
 *  `req.appUser.mobile` instead. `authenticateAppUser` still gates the route
 *  itself (must be logged into the app at all), it just isn't what ties the
 *  request to a specific lab-partner account. */
export const downloadReport = asyncHandler(async (req: Request, res: Response) => {
  const { user_fid: userFid } = req.query as { user_fid: string };
  const testRegnId = Number(req.params.testRegnId);

  const pdf = await thirdPartyReportService.downloadThirdPartyReport(userFid, testRegnId);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="report-${testRegnId}.pdf"`);
  res.status(200).send(pdf);
});

export const updatePaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { testRegnID, amountPaid, currentPayAmt, userID } = req.body as {
    testRegnID: number;
    amountPaid: number;
    currentPayAmt: number;
    userID: string;
  };

  await thirdPartyReportService.updateThirdPartyPaymentStatus({
    testRegnId: testRegnID,
    amountPaid,
    currentPayAmt,
    userId: userID,
  });

  res.status(200).json(AppApiResponse.success("Payment status updated successfully"));
});

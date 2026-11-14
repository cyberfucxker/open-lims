import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { logger } from "../utils/logger";
import { assertReportAccessible, logReportDownloaded } from "../services/app/myReports.service";
import { generatePdfForReport } from "../services/report.service";
import * as webhookService from "../services/whatsapp/webhook.service";
import { verifyReportToken } from "../services/whatsapp/tools/orders.tools";

/** GET — Meta's subscription handshake. */
export const verify = asyncHandler(async (req: Request, res: Response) => {
  const challenge = await webhookService.verifySubscription(
    req.params.accountId,
    req.query["hub.mode"],
    req.query["hub.verify_token"],
    req.query["hub.challenge"],
  );
  res.status(200).type("text/plain").send(challenge);
});

/** POST — signature checked synchronously, then 200 straight away; the
 *  message itself is processed after the response (Meta retries anything
 *  slow, and redeliveries are dropped by the unique `wamid`). */
export const receive = asyncHandler(async (req: Request, res: Response) => {
  const account = await webhookService.loadActiveAccount(req.params.accountId);
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
  webhookService.assertSignature(account, raw, req.header("x-hub-signature-256"));

  let body: unknown;
  try {
    body = JSON.parse(raw.toString("utf8"));
  } catch {
    res.sendStatus(400);
    return;
  }
  res.sendStatus(200);
  setImmediate(() => {
    webhookService.processPayload(account, body).catch((error) => {
      logger.error("WhatsApp webhook processing failed", {
        accountId: account.id,
        error: String(error),
      });
    });
  });
});

/** Short-lived signed report link sent on WhatsApp after the DOB check. */
export const downloadReport = asyncHandler(async (req: Request, res: Response) => {
  const { reportId, appUserId } = verifyReportToken(req.params.token);
  await assertReportAccessible(appUserId, reportId);
  await logReportDownloaded(reportId);
  const { buffer, reportNo } = await generatePdfForReport(reportId);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${reportNo}.pdf"`);
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(buffer);
});

import express, { Router } from "express";
import rateLimit from "express-rate-limit";
import * as controller from "../controllers/whatsappWebhook.controller";

/** Public, unauthenticated: Meta's webhook and the signed report links.
 *  Mounted before the global JSON parser and rate limiter (see app.ts) —
 *  the signature is computed over the raw body, and Meta's bursts must not
 *  be throttled like browser traffic. */
const router = Router();

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/report/:token", reportLimiter, controller.downloadReport);
router.get("/:accountId", controller.verify);
router.post("/:accountId", express.raw({ type: "*/*", limit: "2mb" }), controller.receive);

export { router as whatsappWebhookRouter };

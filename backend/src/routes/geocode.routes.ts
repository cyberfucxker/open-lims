import { Router } from "express";
import * as geocodeController from "../controllers/geocode.controller";
import { authenticate } from "../middleware/auth.middleware";
import { geocodeRateLimiter } from "../middleware/rateLimiter.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  geocodeReverseValidation,
  geocodeSearchValidation,
} from "../validations/app/geocode.validation";

const router = Router();

/** Staff-only (any authenticated role — no `requireRole`, since "search for
 *  a place" is a UI helper, not a privileged action) and rate-limited with
 *  the same limiter the public patient-app route uses: the constraint being
 *  respected is OpenStreetMap's own no-heavy-use etiquette, which doesn't
 *  care which of our surfaces the traffic came from. Its 429 body is the
 *  patient-app envelope (`{status,…}`); both envelopes carry `message`,
 *  which is all the admin client reads off an error. */
router.use(authenticate);

/** Forward search for the Diagnostic Center form's map picker. Query
 *  validation is shared verbatim with the patient-app route — same upstream,
 *  same limits. */
router.get(
  "/search",
  geocodeRateLimiter,
  geocodeSearchValidation,
  validate,
  geocodeController.search,
);

/** Reverse-geocode the dropped pin, so the form can show (and offer to fill
 *  in) the address at the coordinates the admin just picked. */
router.get(
  "/reverse",
  geocodeRateLimiter,
  geocodeReverseValidation,
  validate,
  geocodeController.reverse,
);

export { router as geocodeRouter };

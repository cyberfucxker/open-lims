import { Router } from "express";
import { phleboAuthRouter } from "./auth.routes";
import { phleboProfileRouter } from "./profile.routes";
import { phleboContentRouter } from "./content.routes";
import { phleboDashboardRouter } from "./dashboard.routes";
import { phleboBookingRouter } from "./booking.routes";
import { phleboNotificationRouter } from "./notification.routes";

const router = Router();

// Phlebo App (sample-boy) module — mounted at /api/v1/sample-boy in app.ts.
// Same separation reasoning as the Patient App's /api/v1/app router: its own
// auth (authenticatePhlebo), its own JWT secret, same {status,...} envelope.

router.use(phleboAuthRouter);
router.use(phleboProfileRouter);
router.use(phleboContentRouter);
router.use(phleboDashboardRouter);
router.use(phleboBookingRouter);
router.use(phleboNotificationRouter);

export { router as sampleBoyApiRouter };

import { Router } from "express";
import * as profileController from "../../controllers/app/profile.controller";
import { authenticateAppUser } from "../../middleware/appAuth.middleware";

const router = Router();

/**
 * @openapi
 * /api/v1/app/user/profile:
 *   get:
 *     tags: [App Profile]
 *     summary: Get the logged-in patient's profile
 *     security: [{ AppBearerAuth: [] }]
 *     responses:
 *       200: { description: Profile }
 */
router.get("/user/profile", authenticateAppUser, profileController.getProfile);

export { router as appProfileRouter };

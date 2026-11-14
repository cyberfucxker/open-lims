import { Router } from "express";
import * as profileController from "../../controllers/phlebo/profile.controller";
import { authenticatePhlebo } from "../../middleware/phleboAuth.middleware";
import { uploadPhleboProfilePhoto } from "../../middleware/appUpload.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  phleboCompleteProfileValidation,
  phleboUpdateProfileValidation,
} from "../../validations/phlebo/profile.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/sample-boy/complete-profile:
 *   post:
 *     tags: [Phlebo Profile]
 *     summary: Complete the phlebotomist's profile (onboarding)
 *     security: [{ PhleboBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, sex, d_o_b, address]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               d_o_b: { type: string, example: "1995-04-12" }
 *               address: { type: string }
 *               sex: { type: string, enum: [Male, Female, Other] }
 *               profile_pic: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Profile completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "Profile completed" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: "#/components/schemas/PhleboUser" }
 */
router.post(
  "/complete-profile",
  authenticatePhlebo,
  uploadPhleboProfilePhoto,
  phleboCompleteProfileValidation,
  validate,
  profileController.completeProfile,
);

/**
 * @openapi
 * /api/v1/sample-boy/update-profile:
 *   post:
 *     tags: [Phlebo Profile]
 *     summary: Update the phlebotomist's profile
 *     security: [{ PhleboBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               d_o_b: { type: string, example: "1995-04-12" }
 *               address: { type: string }
 *               sex: { type: string, enum: [Male, Female, Other] }
 *               profile_pic: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "Profile updated" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: "#/components/schemas/PhleboUser" }
 */
router.post(
  "/update-profile",
  authenticatePhlebo,
  uploadPhleboProfilePhoto,
  phleboUpdateProfileValidation,
  validate,
  profileController.updateProfile,
);

/**
 * @openapi
 * /api/v1/sample-boy/profile:
 *   get:
 *     tags: [Phlebo Profile]
 *     summary: Get the logged-in phlebotomist's profile
 *     security: [{ PhleboBearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data: { $ref: "#/components/schemas/PhleboUser" }
 */
router.get("/profile", authenticatePhlebo, profileController.getProfile);

export { router as phleboProfileRouter };

import { Router } from "express";
import * as familyMemberController from "../../controllers/app/familyMember.controller";
import { authenticateAppUser } from "../../middleware/appAuth.middleware";
import { uploadFamilyMemberDoc } from "../../middleware/appUpload.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  addFamilyMemberValidation,
  deleteFamilyMemberValidation,
} from "../../validations/app/familyMember.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/user/family-members:
 *   get:
 *     tags: [App Family Members]
 *     summary: List the logged-in patient's family members
 *     security: [{ AppBearerAuth: [] }]
 *     responses:
 *       200: { description: Family members }
 */
router.get("/user/family-members", authenticateAppUser, familyMemberController.list);

/**
 * @openapi
 * /api/v1/app/user/add-family-member:
 *   post:
 *     tags: [App Family Members]
 *     summary: Add a family member (creates a linked Patient row)
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, mobile_no, dob, relation, gender]
 *             properties:
 *               name: { type: string }
 *               mobile_no: { type: string, example: "9876543210" }
 *               email: { type: string }
 *               dob: { type: string, example: "15-08-1995" }
 *               relation: { type: string, enum: [Father, Mother, Spouse, Son, Daughter, Brother, Sister, Other] }
 *               gender: { type: string, enum: [Male, Female, Other] }
 *     responses:
 *       201: { description: Family member added }
 */
router.post(
  "/user/add-family-member",
  authenticateAppUser,
  uploadFamilyMemberDoc,
  addFamilyMemberValidation,
  validate,
  familyMemberController.add,
);

/**
 * @openapi
 * /api/v1/app/user/delete-family-member:
 *   delete:
 *     tags: [App Family Members]
 *     summary: Delete a family member (blocked for the Self record or one with existing orders)
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [member_id]
 *             properties:
 *               member_id: { type: string, format: uuid }
 *     responses:
 *       200: { description: Family member deleted }
 */
router.delete(
  "/user/delete-family-member",
  authenticateAppUser,
  deleteFamilyMemberValidation,
  validate,
  familyMemberController.remove,
);

export { router as appFamilyMemberRouter };

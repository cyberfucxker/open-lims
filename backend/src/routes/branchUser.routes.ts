import { Router } from "express";
import { query } from "express-validator";
import * as branchUserController from "../controllers/branchUser.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";

const router = Router();

// Read-only, ADMIN-only: this exists solely to populate the Test form's "Branch
// User" picker (see `branchUser.service.ts` for why it isn't a users CRUD module).
router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  [query("search").optional().trim()],
  validate,
  branchUserController.list,
);

export { router as branchUserRouter };

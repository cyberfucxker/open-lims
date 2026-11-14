import { Router } from "express";
import * as controller from "../controllers/whatsapp.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { requireStaffModule } from "../middleware/staffModule.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  accountValidation,
  idParamValidation,
  knowledgeValidation,
  listValidation,
  mappingValidation,
  staffReplyValidation,
  takeoverValidation,
  tryItValidation,
  updateSettingsValidation,
} from "../validations/whatsapp.validation";

/** Superadmin "WhatsApp Assistant". Conversations, the handoff queue and the
 *  AI log are grantable to a MANAGER via the `whatsapp` module; settings,
 *  keys, the knowledge base, concern mapping and Try-it are ADMIN only. */
const router = Router();
const admin = requireRole("ADMIN");
const staff = requireStaffModule("whatsapp");

router.use(authenticate);

router.get("/settings", admin, controller.getSettings);
router.put("/settings", admin, updateSettingsValidation, validate, controller.updateSettings);

router.get("/accounts", admin, controller.listAccounts);
router.post("/accounts", admin, accountValidation, validate, controller.createAccount);
router.patch(
  "/accounts/:id",
  admin,
  idParamValidation,
  accountValidation,
  validate,
  controller.updateAccount,
);
router.post(
  "/accounts/:id/verify-token",
  admin,
  idParamValidation,
  validate,
  controller.regenerateVerifyToken,
);
router.post("/accounts/:id/test", admin, idParamValidation, validate, controller.testAccount);

router.get("/knowledge", admin, controller.listKnowledge);
router.post("/knowledge", admin, knowledgeValidation, validate, controller.createKnowledge);
router.patch(
  "/knowledge/:id",
  admin,
  idParamValidation,
  knowledgeValidation,
  validate,
  controller.updateKnowledge,
);
router.delete("/knowledge/:id", admin, idParamValidation, validate, controller.deleteKnowledge);

router.get("/mappings", admin, controller.listMappings);
router.post("/mappings", admin, mappingValidation, validate, controller.createMapping);
router.patch(
  "/mappings/:id",
  admin,
  idParamValidation,
  mappingValidation,
  validate,
  controller.updateMapping,
);
router.delete("/mappings/:id", admin, idParamValidation, validate, controller.deleteMapping);
router.get("/catalogue-search", admin, controller.searchCatalogue);

router.post("/try", admin, tryItValidation, validate, controller.tryIt);

router.get("/stats", staff, controller.stats);
router.get("/conversations", staff, listValidation, validate, controller.listConversations);
router.get("/conversations/:id", staff, idParamValidation, validate, controller.getConversation);
router.post(
  "/conversations/:id/reply",
  staff,
  staffReplyValidation,
  validate,
  controller.staffReply,
);
router.post(
  "/conversations/:id/takeover",
  staff,
  takeoverValidation,
  validate,
  controller.setTakeover,
);
router.post(
  "/conversations/:id/resolve-handoff",
  staff,
  idParamValidation,
  validate,
  controller.resolveHandoff,
);
router.get("/ai-log", staff, listValidation, validate, controller.aiLog);
router.get("/follow-ups", staff, listValidation, validate, controller.followUps);

export { router as whatsappRouter };

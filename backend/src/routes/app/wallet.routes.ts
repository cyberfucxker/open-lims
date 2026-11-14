import { Router } from "express";
import * as walletController from "../../controllers/app/wallet.controller";
import { authenticateAppUser } from "../../middleware/appAuth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  initiateRechargeValidation,
  transactionsValidation,
  verifyRechargeValidation,
} from "../../validations/app/wallet.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/user/recharge-offers:
 *   get:
 *     tags: [App Wallet]
 *     summary: Get recharge offers and the current wallet balance
 *     security: [{ AppBearerAuth: [] }]
 *     responses:
 *       200: { description: Recharge offers }
 */
router.get("/user/recharge-offers", authenticateAppUser, walletController.getRechargeOffers);

/**
 * @openapi
 * /api/v1/app/user/wallet/balance:
 *   get:
 *     tags: [App Wallet]
 *     summary: Get the wallet balance
 *     security: [{ AppBearerAuth: [] }]
 *     responses:
 *       200: { description: Wallet balance }
 */
router.get("/user/wallet/balance", authenticateAppUser, walletController.getBalance);

/**
 * @openapi
 * /api/v1/app/user/wallet/recharge/initiate:
 *   post:
 *     tags: [App Wallet]
 *     summary: Initiate a wallet recharge (pairs with Payments create-order/verify)
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number, example: 1000 }
 *               offer_id: { type: string, format: uuid }
 *     responses:
 *       201: { description: Recharge initiated }
 */
router.post(
  "/user/wallet/recharge/initiate",
  authenticateAppUser,
  initiateRechargeValidation,
  validate,
  walletController.initiateRecharge,
);

/**
 * @openapi
 * /api/v1/app/user/wallet/recharge/verify:
 *   post:
 *     tags: [App Wallet]
 *     summary: Confirm a recharge after its payment succeeded
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recharge_id, payment_id]
 *             properties:
 *               recharge_id: { type: string, format: uuid }
 *               payment_id: { type: string, format: uuid }
 *     responses:
 *       200: { description: Recharge verified }
 */
router.post(
  "/user/wallet/recharge/verify",
  authenticateAppUser,
  verifyRechargeValidation,
  validate,
  walletController.verifyRecharge,
);

/**
 * @openapi
 * /api/v1/app/user/wallet/transactions:
 *   get:
 *     tags: [App Wallet]
 *     summary: List wallet transaction history
 *     security: [{ AppBearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: per_page
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Transactions }
 */
router.get(
  "/user/wallet/transactions",
  authenticateAppUser,
  transactionsValidation,
  validate,
  walletController.getTransactions,
);

export { router as appWalletRouter };

import { Router } from "express";
import * as dashboardController from "../../controllers/phlebo/dashboard.controller";
import { authenticatePhlebo } from "../../middleware/phleboAuth.middleware";

const router = Router();

/**
 * @openapi
 * /api/v1/sample-boy/dashboard:
 *   get:
 *     tags: [Phlebo Dashboard]
 *     summary: Dashboard summary
 *     security: [{ PhleboBearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     date: { type: string, example: "2026-07-24" }
 *                     stats: { $ref: "#/components/schemas/DashboardStats" }
 *                     today_orders:
 *                       type: array
 *                       items: { $ref: "#/components/schemas/Booking" }
 */
router.get("/dashboard", authenticatePhlebo, dashboardController.getDashboard);

/**
 * @openapi
 * /api/v1/sample-boy/dashboard/stats:
 *   get:
 *     tags: [Phlebo Dashboard]
 *     summary: Dashboard stats only
 *     security: [{ PhleboBearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data: { $ref: "#/components/schemas/DashboardStats" }
 */
router.get("/dashboard/stats", authenticatePhlebo, dashboardController.getStats);

export { router as phleboDashboardRouter };

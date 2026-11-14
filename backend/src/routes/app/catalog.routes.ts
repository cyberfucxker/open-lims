import { Router } from "express";
import * as catalogController from "../../controllers/app/catalog.controller";
import { attachAppUserIfPresent, authenticateAppUser } from "../../middleware/appAuth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  addToCartValidation,
  listCatalogValidation,
  searchSuggestionsValidation,
} from "../../validations/app/catalog.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/user/tests:
 *   get:
 *     tags: [App Catalog]
 *     summary: Get the individual diagnostic tests catalog — guest-browsable
 *     description: "Public: works without a Bearer token for guest browsing. Includes every directly-bookable Parameter (doTest=true) alongside curated Tests, indistinguishably — see Test.sourceParameterId."
 *     parameters:
 *       - in: query
 *         name: city_id
 *         schema: { type: string, format: uuid }
 *         description: "Selected city — scopes the list/prices to that city's parent franchise, if one is set. Omit for the full global catalogue."
 *       - in: query
 *         name: category_id
 *         schema: { type: string, format: uuid }
 *         description: "Home screen's lifestyle/condition category tile id (AppCategory.id) — omit for every category."
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: page_size
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: "Matches by name (and short name, for tests)."
 *     responses:
 *       200: { description: "Paginated tests — { items, total, page, page_size, total_pages }" }
 */
router.get(
  "/user/tests",
  attachAppUserIfPresent,
  listCatalogValidation,
  validate,
  catalogController.listTests,
);

/**
 * @openapi
 * /api/v1/app/user/packages:
 *   get:
 *     tags: [App Catalog]
 *     summary: Get the diagnostic test packages catalog — guest-browsable
 *     description: "Public: works without a Bearer token for guest browsing."
 *     parameters:
 *       - in: query
 *         name: city_id
 *         schema: { type: string, format: uuid }
 *         description: "Selected city — scopes the list/prices to that city's parent franchise, if one is set. Omit for the full global catalogue."
 *       - in: query
 *         name: category_id
 *         schema: { type: string, format: uuid }
 *         description: "Home screen's lifestyle/condition category tile id (AppCategory.id) — omit for every category."
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: page_size
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: "Matches by package name."
 *     responses:
 *       200: { description: "Paginated packages — { items, total, page, page_size, total_pages }" }
 */
router.get(
  "/user/packages",
  attachAppUserIfPresent,
  listCatalogValidation,
  validate,
  catalogController.listPackages,
);

/**
 * @openapi
 * /api/v1/app/user/search-suggestions:
 *   get:
 *     tags: [App Catalog]
 *     summary: Home page search-as-you-type dropdown — top 5 Tests + top 5 Packages matching `q`
 *     description: "Public: works without a Bearer token for guest browsing. `tests` includes every directly-bookable, curated `isCommonlyUsed` Parameter alongside real Tests, exactly like GET /user/tests — a non-bookable or not-yet-curated Parameter never appears here."
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string, minLength: 2, maxLength: 100 }
 *       - in: query
 *         name: city_id
 *         schema: { type: string, format: uuid }
 *         description: "Selected city — scopes prices to that city's parent franchise, if one is set."
 *     responses:
 *       200: { description: "{ tests: TestCatalogItem[], packages: PackageCatalogItem[] } — up to 5 each" }
 */
router.get(
  "/user/search-suggestions",
  attachAppUserIfPresent,
  searchSuggestionsValidation,
  validate,
  catalogController.searchSuggestions,
);

/**
 * @openapi
 * /api/v1/app/user/add-cart:
 *   post:
 *     tags: [App Catalog]
 *     summary: Add a test or package to the cart, for one or several family members
 *     description: >
 *       Send `family_member_ids` to book the same item for several people —
 *       one cart line per member, which is what lets a single order cover a
 *       whole family. `family_member_id` (singular) is the original
 *       single-member form and still works; the array wins if both are sent,
 *       and with neither the item goes to the account holder. Adding an item
 *       a member already has is a no-op, not an error, so the call is safe to
 *       retry.
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, type_id]
 *             properties:
 *               family_member_ids:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 20
 *                 items: { type: string, format: uuid }
 *                 description: "Book this item for each of these members — one cart line each."
 *               family_member_id: { type: string, format: uuid, description: "Single-member form. Omit/blank for the account holder." }
 *               type: { type: string, enum: ["1", "3"], description: "1 = package, 3 = test" }
 *               type_id: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Added to cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: "Item added to cart successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     family_member_ids:
 *                       type: array
 *                       items: { type: string, format: uuid }
 *                       description: "Everyone this item is in the cart for after the call."
 *       404: { description: Family member not found }
 */
router.post(
  "/user/add-cart",
  authenticateAppUser,
  addToCartValidation,
  validate,
  catalogController.addToCart,
);

export { router as appCatalogRouter };

import { Router } from "express";
import * as homeController from "../../controllers/app/home.controller";
import * as homeFaqController from "../../controllers/app/homeFaq.controller";
import * as homeSeoContentController from "../../controllers/app/homeSeoContent.controller";
import { attachAppUserIfPresent } from "../../middleware/appAuth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { getHomeValidation } from "../../validations/app/home.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/user/home:
 *   get:
 *     tags: [App Home]
 *     summary: Get home dashboard data (banners + categories) — guest-browsable
 *     description: >
 *       Public: works without a Bearer token for guest browsing. A logged-in
 *       patient sending one still gets personalised `is_added_to_cart` flags;
 *       a guest just sees them all false.
 *     parameters:
 *       - in: query
 *         name: city_id
 *         required: false
 *         schema: { type: string, format: uuid }
 *         description: >
 *           The patient's selected city. When given, each Popular
 *           Test/Package's `offer_price` and `is_available_in_city` reflect
 *           that city's resolved price list — same rule as
 *           GET /api/v1/app/catalog/tests|packages. Omitted (or unresolved
 *           to a price list) falls back to the global price, same as today.
 *     responses:
 *       200: { description: Home data }
 */
router.get(
  "/user/home",
  attachAppUserIfPresent,
  getHomeValidation,
  validate,
  homeController.getHome,
);

/**
 * @openapi
 * /api/v1/app/user/home-faqs:
 *   get:
 *     tags: [App Home]
 *     summary: Get the Home page's FAQ accordion — guest-browsable
 *     description: >
 *       Public. Active FAQs only, in display order. `question`/`answer` may
 *       contain a literal "{city}" token — substitute it client-side with
 *       the patient's selected city name (or a generic fallback if none is
 *       picked yet).
 *     responses:
 *       200: { description: Home FAQs }
 */
router.get("/user/home-faqs", homeFaqController.listHomeFaqs);

/**
 * @openapi
 * /api/v1/app/user/home-seo-content:
 *   get:
 *     tags: [App Home]
 *     summary: Get the Home page's editable SEO intro block — guest-browsable
 *     description: >
 *       Public. `body` is HTML and may contain a literal "{city}" token, same
 *       substitution rule as /user/home-faqs.
 *     responses:
 *       200: { description: Home SEO content }
 */
router.get("/user/home-seo-content", homeSeoContentController.getHomeSeoContent);

export { router as appHomeRouter };

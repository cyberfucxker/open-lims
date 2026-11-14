import { Router } from "express";
import { param } from "express-validator";
import * as catalogDetailController from "../../controllers/app/catalogDetail.controller";
import { validate } from "../../middleware/validate.middleware";

const router = Router();

const testIdParam = [param("id").isUUID().withMessage("Invalid test id")];
const packageIdParam = [param("id").isUUID().withMessage("Invalid package id")];

// Slugs are plain, already-normalised strings (see `utils/slug.util.ts`) —
// no format beyond "non-empty" to check; an unrecognised one 404s same as a
// well-formed-but-wrong uuid would for the routes above.
const citySlugParam = param("citySlug").trim().isLength({ min: 1 });
const cityTestSlugParams = [citySlugParam, param("testSlug").trim().isLength({ min: 1 })];
const cityPackageSlugParams = [citySlugParam, param("packageSlug").trim().isLength({ min: 1 })];

/**
 * @openapi
 * /api/v1/app/tests/{id}/details:
 *   get:
 *     tags: [App Catalog]
 *     summary: Get a test's full detail, including its parameter list
 *     description: >
 *       Customer-scoped twin of GET /api/v1/tests/{id}/details — same underlying
 *       service, so both surfaces always agree. Each entry of `parameters[]`
 *       carries `bookable`, which is that parameter's `doTest` flag: true means
 *       the app should render a clickable "+ Add", false means a plain
 *       non-interactive list item. Inactive tests read as 404.
 *     security: [{ AppBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Test details }
 *       404: { description: Test not found or inactive }
 */
// Public — a details view has nothing to personalise, and a guest needs to
// reach it while browsing before ever logging in.
router.get("/tests/:id/details", testIdParam, validate, catalogDetailController.getTestDetails);

/**
 * @openapi
 * /api/v1/app/packages/{id}/details:
 *   get:
 *     tags: [App Catalog]
 *     summary: Get a package's full detail, including every parameter it contains
 *     description: >
 *       Customer-scoped twin of GET /api/v1/packages/{id}/details. `parameters[]`
 *       is the FULL flattened analyte list — every parameter of every member
 *       test, plus the package's own standalone parameters — de-duplicated, each
 *       tagged with `bookable` (the parameter's `doTest` flag). The same
 *       analytes also appear grouped under `tests[].parameters[]` (not
 *       de-duplicated across sibling tests, so their sum can exceed
 *       `parameters.length`), and the ones belonging to no member test are
 *       repeated in `standaloneParameters[]`. Inactive or soft-deleted packages
 *       read as 404.
 *     security: [{ AppBearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Package details }
 *       404: { description: Package not found or inactive }
 */
// Public — same reasoning as the test details route above.
router.get(
  "/packages/:id/details",
  packageIdParam,
  validate,
  catalogDetailController.getPackageDetails,
);

/**
 * @openapi
 * /api/v1/app/city/{citySlug}/tests/{testSlug}/details:
 *   get:
 *     tags: [App Catalog]
 *     summary: Test detail for the SEO city landing page, priced for that city
 *     description: >
 *       Same shape as GET /api/v1/app/tests/{id}/details, plus `city`, and the
 *       sale price swapped for that city's own price-list override when one
 *       exists — see `catalogDetail.service.ts#getTestDetailForCity`. Backs
 *       BOTH patient-web detail routes, which differ only in URL family:
 *       `/tests/{citySlug}/{testSlug}` for a real Test and
 *       `/parameter/{citySlug}/{testSlug}` for the shadow Test behind a
 *       directly-bookable Parameter — the response's `isParameter` says which
 *       family the resolved row belongs to, and the app redirects to the
 *       canonical one if the URL used the other.
 *     parameters:
 *       - in: path
 *         name: citySlug
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: testSlug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Test details, city-scoped }
 *       404: { description: City, test, or test-in-this-city not found }
 */
// Public — same reasoning as every other detail route in this file.
router.get(
  "/city/:citySlug/tests/:testSlug/details",
  cityTestSlugParams,
  validate,
  catalogDetailController.getTestDetailsForCity,
);

/**
 * @openapi
 * /api/v1/app/city/{citySlug}/packages/{packageSlug}/details:
 *   get:
 *     tags: [App Catalog]
 *     summary: Package detail for the SEO city landing page, priced for that city
 *     description: City+slug twin of the test route above — same rules.
 *     parameters:
 *       - in: path
 *         name: citySlug
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: packageSlug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Package details, city-scoped }
 *       404: { description: City, package, or package-in-this-city not found }
 */
router.get(
  "/city/:citySlug/packages/:packageSlug/details",
  cityPackageSlugParams,
  validate,
  catalogDetailController.getPackageDetailsForCity,
);

export { router as appCatalogDetailRouter };

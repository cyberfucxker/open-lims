import { Router } from "express";
import * as addressController from "../../controllers/app/address.controller";
import { authenticateAppUser } from "../../middleware/appAuth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  addAddressValidation,
  deleteAddressValidation,
  editAddressValidation,
  setDefaultAddressValidation,
} from "../../validations/app/address.validation";

const router = Router();

/**
 * @openapi
 * /api/v1/app/user/address-list:
 *   get:
 *     tags: [App Addresses]
 *     summary: List the logged-in patient's saved addresses
 *     security: [{ AppBearerAuth: [] }]
 *     responses:
 *       200: { description: Addresses }
 */
router.get("/user/address-list", authenticateAppUser, addressController.list);

/**
 * @openapi
 * /api/v1/app/user/areas:
 *   get:
 *     tags: [App Addresses]
 *     summary: List areas for a city (backs the Area picker in Add/Edit Address)
 *     security: [{ AppBearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: city_id
 *         required: false
 *         schema: { type: string, format: uuid }
 *         description: Defaults to the caller's own profile city if omitted
 *     responses:
 *       200: { description: Areas }
 */
router.get("/user/areas", authenticateAppUser, addressController.listAreas);

/**
 * @openapi
 * /api/v1/app/user/add-address:
 *   post:
 *     tags: [App Addresses]
 *     summary: Add an address (first address is forced default)
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address]
 *             properties:
 *               name: { type: string, enum: [home, work, other] }
 *               house_no: { type: string, description: "Flat / house number." }
 *               block_no: { type: string, description: "Building or block within a complex — optional." }
 *               apartment: { type: string, description: "Apartment / society name — optional." }
 *               address: { type: string }
 *               locality: { type: string }
 *               landmark: { type: string }
 *               city: { type: string, description: "From the map's reverse-geocode; fuzzy-matched to the serviceable City master server-side." }
 *               state: { type: string, description: "From the map; overwritten by the matched city's own state when one matches." }
 *               pincode: { type: string, example: "302001", description: "From the map. Optional — a pin OSM has no postcode for still saves." }
 *               phone: { type: string, example: "9876543210", description: "Optional — falls back to the account holder's own mobile when omitted or blank." }
 *               lat: { type: string }
 *               long: { type: string }
 *               is_default: { type: string, enum: ["0", "1"], description: "Optional — the first address saved is forced default regardless." }
 *     responses:
 *       201: { description: Address added }
 */
router.post(
  "/user/add-address",
  authenticateAppUser,
  addAddressValidation,
  validate,
  addressController.add,
);

/**
 * @openapi
 * /api/v1/app/user/edit-address:
 *   patch:
 *     tags: [App Addresses]
 *     summary: Edit an address (never touches is_default — use Set Default instead)
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [address_id, name, address]
 *             properties:
 *               address_id: { type: string, format: uuid }
 *               name: { type: string, enum: [home, work, other] }
 *               house_no: { type: string }
 *               block_no: { type: string }
 *               apartment: { type: string }
 *               address: { type: string }
 *               locality: { type: string }
 *               landmark: { type: string }
 *               city: { type: string, description: "Optional — omit to keep the address's existing city." }
 *               state: { type: string, description: "Optional — omit to keep the address's existing state." }
 *               pincode: { type: string, description: "Optional — omit to keep the address's existing pincode." }
 *               phone: { type: string, description: "Optional — omit to keep the address's existing number." }
 *               lat: { type: string }
 *               long: { type: string }
 *     responses:
 *       200: { description: Address updated }
 */
router.patch(
  "/user/edit-address",
  authenticateAppUser,
  editAddressValidation,
  validate,
  addressController.edit,
);

/**
 * @openapi
 * /api/v1/app/user/delete-address:
 *   delete:
 *     tags: [App Addresses]
 *     summary: Delete an address (blocked while in use by an active order)
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [address_id]
 *             properties:
 *               address_id: { type: string, format: uuid }
 *     responses:
 *       200: { description: Address deleted }
 */
router.delete(
  "/user/delete-address",
  authenticateAppUser,
  deleteAddressValidation,
  validate,
  addressController.remove,
);

/**
 * @openapi
 * /api/v1/app/user/set-default-address:
 *   post:
 *     tags: [App Addresses]
 *     summary: Set an address as the default (atomically un-defaults the rest)
 *     security: [{ AppBearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [address_id]
 *             properties:
 *               address_id: { type: string, format: uuid }
 *     responses:
 *       200: { description: Default address updated }
 */
router.post(
  "/user/set-default-address",
  authenticateAppUser,
  setDefaultAddressValidation,
  validate,
  addressController.setDefault,
);

export { router as appAddressRouter };

import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

/** OpenAPI 3 spec for the Patient App namespace only
 *  (`/api/v1/app/*`) — generated from the `@openapi` JSDoc blocks living
 *  directly above each route definition in `routes/app/*.routes.ts`, so the
 *  spec can never drift from the actual route list the way a hand-maintained
 *  YAML file would. The internal admin/franchise API is not documented here.
 */
export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Open LIMS Patient App API",
      version: "1.0.0",
      description:
        "Patient-facing (mobile app) REST API for the LIMS platform — reuses the same database as the internal admin/franchise API. All endpoints below are mounted under /api/v1/app.",
    },
    servers: [{ url: `http://localhost:${env.PORT}`, description: "Local" }],
    components: {
      securitySchemes: {
        AppBearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Patient App session token from POST /api/v1/app/user/verify-otp",
        },
      },
    },
  },
  apis: [path.join(__dirname, "../routes/app/*.{ts,js}")],
});

/** OpenAPI 3 spec for the Phlebo (sample collection boy) App namespace only
 *  (`/api/v1/sample-boy/*`) — same JSDoc-driven approach as the Patient App
 *  spec above, kept as an entirely separate document/UI since the two are
 *  different mobile clients with different tokens, matching `phlebo.md`'s
 *  endpoint list. `Phlebo`/`Booking`/etc. are declared once here as reusable
 *  `components.schemas` and `$ref`'d from each route's JSDoc block, instead
 *  of repeating the same object shape in every operation.
 */
export const phleboSwaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Open LIMS Phlebo App API",
      version: "1.0.0",
      description:
        "Phlebotomist-facing (sample collection boy mobile app) REST API — reuses the same AppOrder/Phlebotomist tables as the internal admin and Patient App. All endpoints below are mounted under /api/v1/sample-boy. See phlebo.md at the repo root for the original endpoint list this was built from.",
    },
    servers: [{ url: `http://localhost:${env.PORT}`, description: "Local" }],
    tags: [
      { name: "Phlebo Auth", description: "Mobile OTP login" },
      { name: "Phlebo Profile", description: "Onboarding and profile management" },
      { name: "Phlebo Content", description: "Terms, privacy policy, help & support" },
      { name: "Phlebo Dashboard", description: "Today's summary and lifetime stats" },
      { name: "Phlebo Bookings", description: "Assigned sample-collection bookings" },
      {
        name: "Phlebo Notifications",
        description: "In-app notification list for booking assignment/cancellation events",
      },
    ],
    components: {
      securitySchemes: {
        PhleboBearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Phlebo App session token from POST /api/v1/sample-boy/verify-otp",
        },
      },
      schemas: {
        PhleboUser: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Rahul Kumar" },
            mobile: { type: "string", example: "9876543210" },
            email: { type: "string", nullable: true, example: "rahul@example.com" },
            profile_pic: { type: "string", nullable: true, example: "https://.../avatar.jpg" },
            d_o_b: { type: "string", nullable: true, example: "1995-04-12" },
            age: { type: "string", nullable: true, example: "31" },
            sex: {
              type: "string",
              nullable: true,
              enum: ["Male", "Female", "Other"],
              example: "Male",
            },
            address: { type: "string", nullable: true, example: "South Delhi" },
            is_profile_complete: { type: "boolean" },
          },
        },
        BookingTest: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "CBC" },
            price: { type: "number", example: 399 },
          },
        },
        Booking: {
          type: "object",
          description: "One assigned sample-collection order (an AppOrder).",
          properties: {
            id: { type: "string", format: "uuid" },
            order_number: { type: "string", example: "ORD000123" },
            patient_name: { type: "string", example: "Anita Sharma" },
            patient_phone: { type: "string", example: "9876500000" },
            address: { type: "string", example: "Lajpat Nagar, Delhi" },
            latitude: { type: "number", nullable: true, example: 28.5677 },
            longitude: { type: "number", nullable: true, example: 77.2431 },
            time_slot: { type: "string", nullable: true, example: "10:00 AM - 11:00 AM" },
            tests_count: { type: "integer", example: 2 },
            amount: { type: "number", example: 899.0 },
            payment_status: { type: "string", example: "pending" },
            payment_method: { type: "string", enum: ["cod", "online"], example: "cod" },
            cod_payment_status: { type: "string", example: "" },
            can_mark_cod_collected: { type: "boolean" },
            status: {
              type: "string",
              enum: [
                "pending",
                "accepted",
                "started_journey",
                "reached",
                "sample_collected",
                "sample_dropped",
                "completed",
                "rejected",
                "cancelled",
              ],
              example: "accepted",
            },
            status_label: { type: "string", example: "Accepted" },
            next_actions: {
              type: "array",
              items: { type: "string" },
              example: ["started_journey", "rejected"],
            },
            barcode_number: { type: "string", nullable: true, example: "BC00123" },
            pin_required: { type: "boolean" },
            pin_verified: { type: "boolean" },
            collection_date: { type: "string", example: "2026-07-24" },
            remarks: { type: "string", example: "" },
            tests: { type: "array", items: { $ref: "#/components/schemas/BookingTest" } },
          },
        },
        BookingList: {
          type: "object",
          properties: {
            bookings: { type: "array", items: { $ref: "#/components/schemas/Booking" } },
            current_page: { type: "integer", example: 1 },
            last_page: { type: "integer", example: 3 },
            total: { type: "integer", example: 45 },
          },
        },
        DashboardStats: {
          type: "object",
          properties: {
            total: { type: "integer", example: 12 },
            pending: { type: "integer", example: 4 },
            accepted: { type: "integer", example: 3 },
            rejected: { type: "integer", example: 1 },
            refund: { type: "integer", example: 0 },
            completed: { type: "integer", example: 4 },
          },
        },
        ContentPage: {
          type: "object",
          properties: {
            title: { type: "string", example: "Terms & Conditions" },
            content: { type: "string", example: "<p>HTML content...</p>" },
            updated_at: { type: "string", example: "2026-01-01" },
          },
        },
        HelpSupport: {
          type: "object",
          properties: {
            phone: { type: "string", nullable: true, example: "+91-9876543210" },
            email: { type: "string", nullable: true, example: "support@example.com" },
            whatsapp: { type: "string", nullable: true, example: "+91-9876543210" },
            address: { type: "string", nullable: true, example: "Example HQ, ..." },
            working_hours: { type: "string", nullable: true, example: "9 AM – 7 PM, Mon–Sat" },
            faqs: {
              type: "array",
              items: {
                type: "object",
                properties: { question: { type: "string" }, answer: { type: "string" } },
              },
            },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "../routes/phlebo/*.{ts,js}")],
});

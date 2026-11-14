import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // Comma-separated list — the LIMS admin (3000) and Superadmin (3100)
  // frontends are two separate origins that both need to call this API.
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3000,http://localhost:3100")
    .transform((value) => value.split(",").map((origin) => origin.trim())),
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "debug"]).default("info"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  // Auth
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(30),
  PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES: z.coerce.number().int().positive().default(30),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  // Patient App module — separate JWT secret from the staff
  // JWT_ACCESS_SECRET above, since a leaked patient token must never be
  // usable to mint/verify a staff session or vice versa.
  JWT_APP_ACCESS_SECRET: z.string().min(32, "JWT_APP_ACCESS_SECRET must be at least 32 characters"),
  JWT_APP_ACCESS_EXPIRES_IN: z.string().default("30d"),
  OTP_EXPIRES_IN_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),

  // Phlebo App (sample-boy) module — separate JWT secret again, same
  // reasoning as JWT_APP_ACCESS_SECRET above: a leaked phlebo token must
  // never verify as a patient or staff session.
  JWT_PHLEBO_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_PHLEBO_ACCESS_SECRET must be at least 32 characters"),
  JWT_PHLEBO_ACCESS_EXPIRES_IN: z.string().default("30d"),

  // Razorpay — left undefined until real keys are supplied; routes that need
  // them fail fast with a clear error rather than silently no-op-ing.
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // SMS Guru Online — OTP delivery for the Patient/Phlebo apps. Left
  // undefined until real credentials are supplied; SmsService fails fast
  // with a clear error rather than silently no-op-ing (same reasoning as
  // Razorpay above). Only exercised when NODE_ENV=production — see
  // otp.service.ts's sendSms().
  SMS_API_URL: z.string().optional(),
  SMS_USERNAME: z.string().optional(),
  SMS_PASSWORD: z.string().optional(),
  SMS_FROM: z.string().optional(),
  SMS_DLT_ENTITY_ID: z.string().optional(),
  SMS_DLT_CONTENT_ID: z.string().optional(),
  SMS_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  SMS_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  /** Comma-separated head-office numbers that get the `Order_Received_Admin`
   *  SMS for every new booking, on top of the owning franchise. Empty by
   *  default. */
  SMS_ORDER_ALERT_NUMBERS: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean),
    ),

  // Firebase Cloud Messaging (push notifications) — left undefined until a
  // real service-account is supplied; `sendCustomNotification()` fails fast
  // with a clear error rather than silently no-op-ing (same reasoning as
  // Razorpay/SMS above). Values come from the Firebase service-account JSON
  // downloaded from Project Settings > Service Accounts > Generate New
  // Private Key. FIREBASE_PRIVATE_KEY must keep its `\n` sequences literal in
  // the .env file — see `config/firebase.config.ts` for why.
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // Optional third-party partner-lab report bridge (ThirdPartyReport module).
  // See `constants/thirdPartyLab.constants.ts`. All optional; the bridge only
  // works against a real partner once these are set.
  THIRD_PARTY_LAB_ORIGIN: z.string().optional(),
  THIRD_PARTY_LAB_BASE_URL: z.string().optional(),
  THIRD_PARTY_LAB_ID: z.string().optional(),

  // Sitemap — see `services/sitemapGenerator.service.ts`. `SITEMAP_OUTPUT_DIR`
  // left undefined skips regeneration entirely (the expected state for local
  // dev, where there's no Nginx-served static folder to write into); in
  // production it's the patient-web `dist/` folder your web server serves
  // directly, e.g. /var/www/open-lims/patient-dist.
  SITEMAP_OUTPUT_DIR: z.string().optional(),
  SITEMAP_SITE_ORIGIN: z.string().default("https://example.com"),

  // WhatsApp assistant — see `services/whatsapp/`. 32 random bytes, base64
  // (`openssl rand -base64 32`). Encrypts the Meta token/app secret and the
  // Anthropic/speech-to-text keys stored from Superadmin, and signs the
  // short-lived report links. Required in production (checked below).
  // CHANGING IT makes every stored key unreadable — they must be re-entered
  // in Superadmin → WhatsApp Assistant afterwards.
  WHATSAPP_ENCRYPTION_KEY: z.string().optional(),
  /** Public origin of this API, e.g. https://api.example.com — used to show
   *  the Meta webhook callback URL and to build signed report links. */
  PUBLIC_API_BASE_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";

if (isProduction && !env.WHATSAPP_ENCRYPTION_KEY) {
  console.error(
    "WHATSAPP_ENCRYPTION_KEY is required when NODE_ENV=production. " +
      "Generate one with `openssl rand -base64 32` and keep it stable — changing it " +
      "makes the WhatsApp/AI keys stored in the database unreadable.",
  );
  process.exit(1);
}

// Guards against deploying with the localhost dev defaults still in place —
// a misconfigured CORS_ORIGIN in production silently locks out every real
// frontend, so fail fast at boot instead of surfacing as a confusing CORS
// error in the browser later.
if (isProduction && env.CORS_ORIGIN.some((origin) => /localhost|127\.0\.0\.1/.test(origin))) {
  console.error(
    "CORS_ORIGIN contains a localhost entry while NODE_ENV=production. " +
      "Set it to your real frontend origin(s), e.g. https://admin.example.com,https://superadmin.example.com",
  );
  process.exit(1);
}

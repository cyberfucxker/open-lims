import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { ApiResponse } from "../utils/ApiResponse";
import { AppApiResponse } from "../utils/AppApiResponse";

/**
 * Rate limiting is off in development, on everywhere else.
 *
 * On localhost these limits protect nobody and cost real time: the global one
 * is 100 requests per 15 minutes for the WHOLE api, and a single pass through
 * the admin panel spends most of that on page loads alone. Hitting a 429 while
 * clicking around your own machine teaches nothing and reads as a broken app.
 *
 * Gated on NODE_ENV rather than removed, so staging and production keep every
 * limiter exactly as before. The one thing to be careful of: running a
 * PUBLICLY reachable server with NODE_ENV=development leaves it unthrottled.
 * Deployments set NODE_ENV=production (see .env.production.example), and
 * `config/env.ts` already refuses a production boot with a localhost CORS
 * entry, so the combination is hard to reach by accident.
 */
const skipInDevelopment = () => env.NODE_ENV === "development";

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDevelopment,
  message: ApiResponse.error("Too many requests, please try again later."),
});

/** Tighter limit for credential/token-guessing-prone auth endpoints. */
export const authRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: skipInDevelopment,
  message: ApiResponse.error("Too many attempts, please try again later."),
});

/** Patient App equivalent of `authRateLimiter` for OTP send/verify — same
 *  thresholds, but replies in the app namespace's `{status, ...}` envelope. */
export const appAuthRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: skipInDevelopment,
  message: AppApiResponse.error("Too many attempts, please try again later."),
});

/** `geocode.routes.ts` proxies OpenStreetMap Nominatim server-side (the
 *  public instance 403s browser calls with no identifying Referer — see its
 *  usage policy) — this keeps OUR traffic to it within the "no heavy use"
 *  etiquette that policy asks for, independent of any per-account/IP auth
 *  limit, since the route is public. Generous enough for one patient
 *  actively typing in the address search box; nowhere near enough for bulk
 *  scraping. */
export const geocodeRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDevelopment,
  message: AppApiResponse.error("Too many location searches — please slow down a little."),
});

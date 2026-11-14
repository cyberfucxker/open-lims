import axios from "axios";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const OTP_REGEX = /^\d{6}$/;
const RETRIABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

interface SmsCredentials {
  apiUrl: string;
  username: string;
  password: string;
  from: string;
  dltEntityId: string;
  dltContentId: string;
}

/** Fails fast with a clear, non-secret error if any credential is missing —
 *  mirrors resolveCredentials() in razorpay.service.ts. */
function resolveCredentials(): SmsCredentials {
  const {
    SMS_API_URL,
    SMS_USERNAME,
    SMS_PASSWORD,
    SMS_FROM,
    SMS_DLT_ENTITY_ID,
    SMS_DLT_CONTENT_ID,
  } = env;

  if (
    !SMS_API_URL ||
    !SMS_USERNAME ||
    !SMS_PASSWORD ||
    !SMS_FROM ||
    !SMS_DLT_ENTITY_ID ||
    !SMS_DLT_CONTENT_ID
  ) {
    throw ApiError.internal(
      "SMS provider is not configured. Set SMS_API_URL/SMS_USERNAME/SMS_PASSWORD/SMS_FROM/SMS_DLT_ENTITY_ID/SMS_DLT_CONTENT_ID to send OTPs.",
    );
  }

  return {
    apiUrl: SMS_API_URL,
    username: SMS_USERNAME,
    password: SMS_PASSWORD,
    from: SMS_FROM,
    dltEntityId: SMS_DLT_ENTITY_ID,
    dltContentId: SMS_DLT_CONTENT_ID,
  };
}

/** Exact DLT-registered template text — SMS Guru rejects sends whose body
 *  doesn't match the registered content 1:1, so this can't be reworded. */
function buildOtpMessage(otp: string): string {
  return `Your OTP to login is ${otp} Please do not share it with anyone. Team Example Diagnostics Lab`;
}

/** Never log a full mobile number. */
function maskMobile(mobile: string): string {
  return mobile.length > 4 ? `${"*".repeat(mobile.length - 4)}${mobile.slice(-4)}` : "****";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** SMS Guru's gateway responds HTTP 200 with a plain-text/JSON body even on
 *  a rejected send (bad credentials, DLT mismatch, insufficient balance,
 *  etc.) — it doesn't use HTTP status to signal failure. Treat any body
 *  containing an obvious failure marker as a failed send rather than
 *  trusting the 2xx status alone. */
function isGatewayFailure(data: unknown): boolean {
  const text = typeof data === "string" ? data : JSON.stringify(data ?? "");
  return /error|fail(?:ed|ure)?|invalid|reject/i.test(text);
}

function isRetriableError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (!error.response) return true; // network error / timeout — worth a retry
  return RETRIABLE_STATUSES.has(error.response.status);
}

/** A definitive gateway rejection or an exhausted retry budget. Carries the
 *  gateway's own response so callers can log why — never shown to a patient. */
export class SmsDeliveryError extends Error {
  constructor(
    message: string,
    readonly gatewayResponse: string,
  ) {
    super(message);
    this.name = "SmsDeliveryError";
  }
}

function stringifyResponse(data: unknown): string {
  return typeof data === "string" ? data : JSON.stringify(data ?? "");
}

/** One SMS through SMS Guru, with retries for transient failures (timeout,
 *  network error, 5xx/429) and exponential backoff; a definitive gateway
 *  rejection (bad credentials, DLT mismatch, etc.) is not retried. Resolves
 *  with the gateway's response body; rejects with `SmsDeliveryError`. Shared
 *  by OTP and the DLT-template order SMS (`orderSms.service.ts`). */
export async function deliverSms(
  phone: string,
  text: string,
  dltContentId: string,
): Promise<string> {
  const credentials = resolveCredentials();
  const params = {
    username: credentials.username,
    password: credentials.password,
    to: phone,
    from: credentials.from,
    text,
    dltPrincipalEntityId: credentials.dltEntityId,
    dltContentId,
    unicode: "false",
  };

  const maxAttempts = env.SMS_MAX_RETRIES + 1;
  const maskedMobile = maskMobile(phone);

  for (let attempt = 1; ; attempt++) {
    try {
      const response = await axios.get(credentials.apiUrl, {
        params,
        timeout: env.SMS_TIMEOUT_MS,
      });
      const body = stringifyResponse(response.data);

      if (isGatewayFailure(response.data)) {
        logger.error("SMS Guru rejected send", {
          mobile: maskedMobile,
          status: response.status,
          response: response.data,
        });
        throw new SmsDeliveryError("SMS gateway rejected the message", body);
      }

      logger.info("SMS sent", { mobile: maskedMobile, attempt });
      return body;
    } catch (error) {
      if (error instanceof SmsDeliveryError) throw error; // definitive rejection — no retry

      const willRetry = attempt < maxAttempts && isRetriableError(error);
      logger.error("SMS Guru request failed", {
        mobile: maskedMobile,
        attempt,
        willRetry,
        error: axios.isAxiosError(error)
          ? { message: error.message, status: error.response?.status, data: error.response?.data }
          : String(error),
      });

      if (!willRetry) {
        throw new SmsDeliveryError(
          "SMS request failed",
          axios.isAxiosError(error)
            ? stringifyResponse(error.response?.data ?? error.message)
            : String(error),
        );
      }

      await sleep(2 ** (attempt - 1) * 500);
    }
  }
}

/** Reusable SMS sending service (SMS Guru Online transactional gateway). */
export const SmsService = {
  /** Sends a 6-digit login OTP to `phone`. Throws ApiError on any failure —
   *  the caller must treat a rejected promise as "OTP not delivered" and
   *  never assume delivery succeeded. */
  async sendOtp(phone: string, otp: string): Promise<void> {
    if (!MOBILE_REGEX.test(phone)) {
      throw ApiError.badRequest("Enter a valid 10-digit mobile number");
    }
    if (!OTP_REGEX.test(otp)) {
      throw ApiError.badRequest("Invalid OTP code");
    }

    const credentials = resolveCredentials();
    try {
      await deliverSms(phone, buildOtpMessage(otp), credentials.dltContentId);
    } catch (error) {
      if (error instanceof SmsDeliveryError) {
        throw ApiError.internal("Failed to send OTP. Please try again.");
      }
      throw error;
    }
  },
};

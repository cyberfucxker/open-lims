import { prisma } from "../config/database";
import { env, isProduction } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { SmsService } from "./sms.service";
import type { OtpPurpose } from "@prisma/client";

/** Static "123456" in non-production for both the Patient App and Phlebo
 *  App (they share this function) — lets QA/testing log in without reading
 *  the `dev_otp` field every time. Real random generation stays in place
 *  for production so this can't become a live security hole once a real
 *  SMS provider is wired into `sendSms()` below. */
function generateOtp(): string {
  if (!isProduction) {
    return "123456";
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** In non-production the OTP is returned to the caller instead of being
 *  sent, so the app is fully testable without burning real SMS credits —
 *  see generateOtp()'s static "123456" above. Production sends go through
 *  SmsService (SMS Guru Online). */
async function sendSms(mobile: string, otpCode: string): Promise<void> {
  if (!isProduction) {
    return;
  }
  await SmsService.sendOtp(mobile, otpCode);
}

/** Invalidates any prior unverified OTP for this mobile+purpose, then
 *  inserts and "sends" a fresh one. Returns the OTP only in non-production
 *  so tests/dev can log in without a real SMS account. */
export async function issueOtp(
  mobile: string,
  purpose: OtpPurpose = "LOGIN",
): Promise<{ devOtp?: string }> {
  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_IN_MINUTES * 60 * 1000);

  await prisma.$transaction([
    prisma.otpCode.updateMany({
      where: { mobile, purpose, isVerified: false },
      data: { isVerified: true }, // invalidate — never matchable again
    }),
    prisma.otpCode.create({ data: { mobile, purpose, otpCode, expiresAt } }),
  ]);

  await sendSms(mobile, otpCode);

  return isProduction ? {} : { devOtp: otpCode };
}

/** Validates and consumes an OTP. Throws ApiError on any failure (wrong
 *  code, expired, too many attempts) rather than returning a boolean, so
 *  callers can't accidentally ignore a failed verification. */
export async function verifyOtp(
  mobile: string,
  otpCode: string,
  purpose: OtpPurpose = "LOGIN",
): Promise<void> {
  const candidate = await prisma.otpCode.findFirst({
    where: { mobile, purpose, isVerified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!candidate) {
    throw ApiError.badRequest(
      "No pending OTP found for this mobile number. Please request a new one.",
    );
  }

  if (candidate.expiresAt < new Date()) {
    throw ApiError.badRequest("This OTP has expired. Please request a new one.");
  }

  if (candidate.attemptCount >= env.OTP_MAX_ATTEMPTS) {
    throw ApiError.badRequest("Too many incorrect attempts. Please request a new OTP.");
  }

  if (candidate.otpCode !== otpCode) {
    await prisma.otpCode.update({
      where: { id: candidate.id },
      data: { attemptCount: { increment: 1 } },
    });
    throw ApiError.badRequest("Incorrect OTP.");
  }

  await prisma.otpCode.update({ where: { id: candidate.id }, data: { isVerified: true } });
}

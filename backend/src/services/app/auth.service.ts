import type { AppPlatform, City } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { signAppAccessToken } from "../../utils/appJwt.util";
import { toDbGender } from "../../utils/enumMappers";
import { logger } from "../../utils/logger";
import { parseDDMMYYYY, toISODateString } from "../../utils/app/date.util";
import { issueOtp, verifyOtp } from "../otp.service";
import { sendCustomNotification } from "../notification.service";
import { createLinkedPatient } from "./patientLink.service";
import type { Gender } from "../../types/patient.types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function sendLoginOtp(mobile: string): Promise<{ dev_otp?: string }> {
  const { devOtp } = await issueOtp(mobile, "LOGIN");
  return devOtp ? { dev_otp: devOtp } : {};
}

async function resolveCity(patientCity: string): Promise<City> {
  if (UUID_REGEX.test(patientCity)) {
    const byId = await prisma.city.findUnique({ where: { id: patientCity } });
    if (byId) return byId;
  }
  const bySlug = await prisma.city.findUnique({ where: { slug: patientCity.toLowerCase() } });
  if (bySlug) return bySlug;

  const byName = await prisma.city.findFirst({
    where: { name: { equals: patientCity, mode: "insensitive" } },
  });
  if (byName) return byName;

  throw ApiError.badRequest("Unknown city. Please select a valid city.");
}

export interface VerifyOtpResult {
  token: string;
  user: { id: string; mobile: string; is_profile_complete: boolean };
  cities: Array<{ id: string; name: string; slug: string }>;
}

export async function verifyLoginOtp(
  mobile: string,
  otp: string,
  platform: AppPlatform,
  /** The client's FCM device token, when it sends one — stored for a future
   *  push notification to use (see `services/notification.service.ts`).
   *  Omitted, not blanked, when absent: a login from a surface that doesn't
   *  have one (e.g. web) must never overwrite a token already on file. */
  fcmToken?: string,
): Promise<VerifyOtpResult> {
  await verifyOtp(mobile, otp, "LOGIN");

  const appUser = await prisma.appUser.upsert({
    where: { mobile },
    update: { platform, ...(fcmToken ? { fcmToken } : {}) },
    create: { mobile, platform, ...(fcmToken ? { fcmToken } : {}) },
  });

  const token = signAppAccessToken({ sub: appUser.id, mobile: appUser.mobile });

  const cities = await prisma.city.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return {
    token,
    user: {
      id: appUser.id,
      mobile: appUser.mobile,
      is_profile_complete: appUser.isProfileComplete,
    },
    cities,
  };
}

export interface CompleteProfileInput {
  name: string;
  sex: Gender;
  d_o_b: string;
  email?: string;
  /** Omit to keep the account's existing city (edit-profile calls don't
   *  necessarily resend it). */
  patient_city?: string;
}

export interface CompleteProfileFiles {
  profilePicUrl?: string;
  verificationDocumentUrl?: string;
}

/** Idempotent: re-calling after the account is already complete just
 *  updates the profile fields again — it never creates a second "Self"
 *  FamilyMember/Patient. Also doubles as Edit Profile for the same reason.
 *  That same "no existing Self yet" check is what tells a genuine first-time
 *  signup apart from a later edit, so it doubles again as the trigger for
 *  the one-time welcome notification below. */
export async function completeProfile(
  appUserId: string,
  input: CompleteProfileInput,
  files?: CompleteProfileFiles,
): Promise<void> {
  const dob = parseDDMMYYYY(input.d_o_b);
  const city = input.patient_city ? await resolveCity(input.patient_city) : null;

  const { appUser, isFirstCompletion } = await prisma.$transaction(async (tx) => {
    const appUser = await tx.appUser.update({
      where: { id: appUserId },
      data: {
        name: input.name,
        email: input.email || null,
        gender: toDbGender(input.sex),
        dob,
        ...(city ? { cityId: city.id } : {}),
        profilePicUrl: files?.profilePicUrl ?? undefined,
        verificationDocumentUrl: files?.verificationDocumentUrl ?? undefined,
        isProfileComplete: true,
      },
    });

    const existingSelf = await tx.familyMember.findFirst({
      where: { appUserId, relation: "SELF" },
    });
    const isFirstCompletion = !existingSelf;

    if (isFirstCompletion) {
      const patient = await createLinkedPatient(
        {
          fullName: input.name,
          gender: input.sex,
          dob: toISODateString(dob),
          mobile: appUser.mobile,
          email: input.email,
        },
        tx,
      );
      await tx.familyMember.create({
        data: { appUserId, patientId: patient.id, relation: "SELF" },
      });
    }

    return { appUser, isFirstCompletion };
  });

  // Outside the transaction — a push notification is a network call to
  // Firebase, not a DB write, so it shouldn't hold the transaction's locks
  // open a moment longer than the actual writes need. Silently skipped when
  // there's no device token on file (e.g. a web signup) — never a failure.
  if (isFirstCompletion && appUser.fcmToken) {
    const result = await sendCustomNotification({
      token: appUser.fcmToken,
      title: `Welcome to Open LIMS, ${input.name}! 🎉`,
      body: "Your profile is all set. Book a home test or package — free doorstep collection, reports in 6–48 hours.",
      data: { type: "WELCOME_SIGNUP" },
    });
    if (!result.success) {
      logger.warn("Welcome notification failed to send", {
        appUserId: appUser.id,
        error: result.error,
      });
    }
  }
}

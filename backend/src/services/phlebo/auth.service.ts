import type { Phlebotomist } from "@prisma/client";
import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { signPhleboAccessToken } from "../../utils/phleboJwt.util";
import { fromDbGender } from "../../utils/enumMappers";
import { computeAge } from "../../repositories/patient.repository";
import { logger } from "../../utils/logger";
import { issueOtp, verifyOtp } from "../otp.service";

const NOT_REGISTERED_MESSAGE =
  "This mobile number is not registered as a phlebotomist. Please contact your admin.";

async function findActivePhlebotomistByMobile(mobile: string): Promise<Phlebotomist> {
  const phlebotomist = await prisma.phlebotomist.findUnique({ where: { mobile } });
  if (!phlebotomist || !phlebotomist.isActive) {
    throw ApiError.unauthorized(NOT_REGISTERED_MESSAGE);
  }
  return phlebotomist;
}

export interface PhleboUserDto {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  profile_pic: string | null;
  d_o_b: string | null;
  age: string | null;
  sex: string | null;
  address: string | null;
  is_profile_complete: boolean;
}

export function toPhleboUserDto(phlebotomist: Phlebotomist): PhleboUserDto {
  return {
    id: phlebotomist.id,
    name: phlebotomist.name,
    mobile: phlebotomist.mobile,
    email: phlebotomist.email,
    profile_pic: phlebotomist.photoUrl,
    d_o_b: phlebotomist.dob ? phlebotomist.dob.toISOString().slice(0, 10) : null,
    age: phlebotomist.dob ? String(computeAge(phlebotomist.dob)) : null,
    sex: phlebotomist.gender ? fromDbGender(phlebotomist.gender) : null,
    address: phlebotomist.address,
    is_profile_complete: phlebotomist.isProfileComplete,
  };
}

/** Unlike the Patient App (which auto-creates an `AppUser` on first OTP
 *  verify), a `Phlebotomist` row must already exist — created by an admin
 *  via the Superadmin panel. An unknown/inactive mobile is rejected before
 *  an OTP is even sent. */
export async function sendLoginOtp(mobile: string): Promise<{ dev_otp?: string }> {
  await findActivePhlebotomistByMobile(mobile);
  const { devOtp } = await issueOtp(mobile, "PHLEBO_LOGIN");

  logger.info("Phlebo login OTP sent", devOtp ? { mobile, otp: devOtp } : { mobile });

  return devOtp ? { dev_otp: devOtp } : {};
}

export interface VerifyPhleboOtpResult {
  token: string;
  user: PhleboUserDto;
}

export async function verifyLoginOtp(
  mobile: string,
  otp: string,
  /** The client's FCM device token, when it sends one — stored for a future
   *  push notification to use (see `services/notification.service.ts`).
   *  Omitted, not blanked, when absent, so a login that doesn't carry one
   *  never clears a token already on file. Unlike the Patient App there's
   *  no existing "update something on every verify" precedent here (this
   *  flow never wrote to the row before), so it's its own explicit update. */
  fcmToken?: string,
): Promise<VerifyPhleboOtpResult> {
  await verifyOtp(mobile, otp, "PHLEBO_LOGIN");
  let phlebotomist = await findActivePhlebotomistByMobile(mobile);

  if (fcmToken) {
    phlebotomist = await prisma.phlebotomist.update({
      where: { id: phlebotomist.id },
      data: { fcmToken },
    });
  }

  const token = signPhleboAccessToken({ sub: phlebotomist.id, mobile: phlebotomist.mobile });

  return { token, user: toPhleboUserDto(phlebotomist) };
}

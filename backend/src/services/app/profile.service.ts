import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { fromDbGender } from "../../utils/enumMappers";
import { computeAge } from "../../repositories/patient.repository";
import { formatDDMMYYYY } from "../../utils/app/date.util";

export interface ProfileResult {
  id: string;
  name: string | null;
  mobile: string;
  email: string | null;
  profile_pic: string | null;
  verification_document: string | null;
  d_o_b: string | null;
  age: string | null;
  sex: string | null;
  is_profile_complete: boolean;
  /** The patient's saved city (`AppUser.cityId` — set from Complete
   *  Profile/the city picker). Null until they've picked one. */
  city_id: string | null;
  city_name: string | null;
}

export async function getProfile(appUserId: string): Promise<ProfileResult> {
  const appUser = await prisma.appUser.findUnique({
    where: { id: appUserId },
    include: { city: { select: { id: true, name: true } } },
  });
  if (!appUser) {
    throw ApiError.notFound("Account not found");
  }

  return {
    id: appUser.id,
    name: appUser.name,
    mobile: appUser.mobile,
    email: appUser.email,
    profile_pic: appUser.profilePicUrl,
    verification_document: appUser.verificationDocumentUrl,
    d_o_b: appUser.dob ? formatDDMMYYYY(appUser.dob) : null,
    age: appUser.dob ? String(computeAge(appUser.dob)) : null,
    sex: appUser.gender ? fromDbGender(appUser.gender) : null,
    is_profile_complete: appUser.isProfileComplete,
    city_id: appUser.city?.id ?? null,
    city_name: appUser.city?.name ?? null,
  };
}

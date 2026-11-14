import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";
import { toDbGender } from "../../utils/enumMappers";
import type { Gender } from "../../types/patient.types";
import { toPhleboUserDto, type PhleboUserDto } from "./auth.service";

async function findPhlebotomistOrThrow(phleboId: string) {
  const phlebotomist = await prisma.phlebotomist.findUnique({ where: { id: phleboId } });
  if (!phlebotomist) {
    throw ApiError.notFound("Phlebotomist account not found");
  }
  return phlebotomist;
}

export async function getProfile(phleboId: string): Promise<PhleboUserDto> {
  const phlebotomist = await findPhlebotomistOrThrow(phleboId);
  return toPhleboUserDto(phlebotomist);
}

export interface CompleteProfileInput {
  name: string;
  sex: Gender;
  d_o_b: string;
  email?: string;
  address: string;
}

export async function completeProfile(
  phleboId: string,
  input: CompleteProfileInput,
  profilePicUrl?: string,
): Promise<PhleboUserDto> {
  await findPhlebotomistOrThrow(phleboId);

  const phlebotomist = await prisma.phlebotomist.update({
    where: { id: phleboId },
    data: {
      name: input.name,
      email: input.email || null,
      gender: toDbGender(input.sex),
      dob: new Date(input.d_o_b),
      address: input.address,
      photoUrl: profilePicUrl ?? undefined,
      isProfileComplete: true,
    },
  });

  return toPhleboUserDto(phlebotomist);
}

export interface UpdateProfileInput {
  name?: string;
  sex?: Gender;
  d_o_b?: string;
  email?: string;
  address?: string;
}

export async function updateProfile(
  phleboId: string,
  input: UpdateProfileInput,
  profilePicUrl?: string,
): Promise<PhleboUserDto> {
  await findPhlebotomistOrThrow(phleboId);

  const phlebotomist = await prisma.phlebotomist.update({
    where: { id: phleboId },
    data: {
      name: input.name,
      email: input.email,
      gender: input.sex ? toDbGender(input.sex) : undefined,
      dob: input.d_o_b ? new Date(input.d_o_b) : undefined,
      address: input.address,
      photoUrl: profilePicUrl,
    },
  });

  return toPhleboUserDto(phlebotomist);
}

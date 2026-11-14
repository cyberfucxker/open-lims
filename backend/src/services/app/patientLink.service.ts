import type { Prisma, Patient } from "@prisma/client";
import * as patientRepository from "../../repositories/patient.repository";
import { nextPatientId } from "../../utils/idGenerator";
import type { Gender } from "../../types/patient.types";

export interface LinkedPatientInput {
  fullName: string;
  gender: Gender;
  /** ISO `yyyy-mm-dd` (or any string `new Date()` parses unambiguously). */
  dob: string;
  mobile: string;
  email?: string;
}

const TITLE_BY_GENDER: Record<Gender, string> = { Male: "Mr", Female: "Ms", Other: "Mx" };

/** Every person the Patient App can book for (the account holder's own
 *  "Self" family member, and every family member added after) becomes a
 *  real `Patient` row through this one function — the same table/repository
 *  the admin/franchise portal's Patient Registration screen uses, so there
 *  is never a second, app-only notion of "a patient". */
export async function createLinkedPatient(
  input: LinkedPatientInput,
  tx: Prisma.TransactionClient,
): Promise<Patient> {
  const patientId = await nextPatientId(tx);
  return patientRepository.createPatient(
    {
      title: TITLE_BY_GENDER[input.gender],
      fullName: input.fullName,
      gender: input.gender,
      dob: input.dob,
      mobile: input.mobile,
      email: input.email,
      patientId,
    },
    tx,
  );
}

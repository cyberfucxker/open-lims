import { delay, newId } from "../delay";
import { mockDb } from "../state";
import type { PrescriptionItem, SubmitPrescriptionRequest } from "@/types";

export const prescriptionApi = {
  async list(): Promise<PrescriptionItem[]> {
    return delay([...mockDb.prescriptions]);
  },

  async submit(payload: SubmitPrescriptionRequest): Promise<null> {
    mockDb.prescriptions = [
      {
        id: newId("presc"),
        name: mockDb.familyMembers.find((m) => m.id === payload.family_member_id)?.name ?? null,
        phone: mockDb.user.mobile,
        relation:
          mockDb.familyMembers.find((m) => m.id === payload.family_member_id)?.relation ?? null,
        city: { id: payload.city_id, name: "Jaipur" },
        query: payload.query ?? null,
        file_url: payload.prescription_file.name,
        status: "SUBMITTED",
        created_at: new Date().toISOString(),
      },
      ...mockDb.prescriptions,
    ];
    return delay(null, 700);
  },

  async remove(id: string): Promise<null> {
    mockDb.prescriptions = mockDb.prescriptions.filter((p) => p.id !== id);
    return delay(null);
  },
};

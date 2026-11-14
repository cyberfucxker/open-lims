import { z } from "zod";

export const monthlyTargetFormSchema = z.object({
  marketingStaffId: z.string().min(1, "Select staff member"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
  revenueTarget: z.coerce.number().min(0),
  doctorTarget: z.coerce.number().min(0),
  patientTarget: z.coerce.number().min(0),
});

export type MonthlyTargetFormSchemaType = z.infer<typeof monthlyTargetFormSchema>;

import { z } from "zod";

export const generateSettlementFormSchema = z.object({
  referralSourceId: z.string().min(1, "Referral is required"),
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  adjustment: z.coerce.number().optional(),
  remarks: z.string().optional(),
});

export type GenerateSettlementFormSchemaType = z.infer<typeof generateSettlementFormSchema>;

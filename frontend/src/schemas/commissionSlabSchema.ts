import { z } from "zod";

export const commissionSlabFormSchema = z.object({
  fromAmount: z.coerce.number().min(0),
  toAmount: z.string().optional().or(z.literal("")),
  percentage: z.coerce.number().min(0).max(100),
  active: z.boolean(),
});

export type CommissionSlabFormSchemaType = z.infer<typeof commissionSlabFormSchema>;

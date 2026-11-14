import { z } from "zod";

export const rejectSampleFormSchema = z.object({
  reason: z.string().min(3, "Enter a rejection reason").max(500),
});

export type RejectSampleFormSchemaType = z.infer<typeof rejectSampleFormSchema>;

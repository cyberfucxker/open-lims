import { z } from "zod";

export const testFormSchema = z.object({
  name: z.string().min(3, "Enter test name"),
  shortName: z.string().min(1, "Enter short name").max(20, "Keep it under 20 characters"),
  departmentId: z.string().min(1, "Select department"),
  categoryId: z.string().min(1, "Select category"),
  price: z.coerce.number().min(1, "Enter a valid price"),
  sampleTypeId: z.string().min(1, "Select sample type"),
  reportTime: z.string().min(1, "Select report time"),
  referenceRange: z.string().min(3, "Enter reference range"),
  status: z.enum(["Active", "Inactive"]),
  description: z.string().min(3, "Enter a short description"),
});

export type TestFormSchemaType = z.infer<typeof testFormSchema>;

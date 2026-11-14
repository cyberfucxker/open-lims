import { z } from "zod";

export const packageFormSchema = z.object({
  name: z.string().min(2, "Enter package name"),
  price: z.coerce.number().min(0, "Enter a valid price"),
  testIds: z.array(z.string()).min(1, "Select at least one test"),
});

export type PackageFormSchemaType = z.infer<typeof packageFormSchema>;

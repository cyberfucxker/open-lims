import { z } from "zod";

export const marketingStaffFormSchema = z.object({
  employeeCode: z.string().min(2, "Enter employee code").max(30, "Keep it under 30 characters"),
  name: z.string().min(2, "Enter name").max(150),
  mobile: z.string().min(6, "Enter a valid mobile number").max(15, "Keep it under 15 characters"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  designation: z.string().max(100, "Keep it under 100 characters").optional().or(z.literal("")),
  branchId: z.string().optional().or(z.literal("")),
  joiningDate: z.string().min(1, "Select joining date"),
  status: z.boolean(),
});

export type MarketingStaffFormSchemaType = z.infer<typeof marketingStaffFormSchema>;

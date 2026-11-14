import { z } from "zod";

export const referralDoctorFormSchema = z.object({
  doctorName: z.string().min(2, "Enter doctor name").max(150),
  hospitalName: z.string().optional().or(z.literal("")),
  speciality: z.string().optional().or(z.literal("")),
  mobile: z.string().optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  remarks: z.string().optional().or(z.literal("")),
  marketingStaffId: z.string().optional().or(z.literal("")),
  status: z.boolean(),
});

export type ReferralDoctorFormSchemaType = z.infer<typeof referralDoctorFormSchema>;

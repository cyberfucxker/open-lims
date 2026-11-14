import { z } from "zod";

const REFERRAL_TYPES = ["DOCTOR", "HOSPITAL", "CLINIC", "SELF", "CORPORATE", "OTHER"] as const;

export const referralSourceFormSchema = z.object({
  referralType: z.enum(REFERRAL_TYPES),
  name: z.string().min(2, "Enter referral name").max(150),
  organizationId: z.string().optional().or(z.literal("")),
  mobile: z.string().min(7, "Enter a valid mobile number").max(15),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  speciality: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  marketingStaffId: z.string().optional().or(z.literal("")),
  assignedPriceListId: z.string().optional().or(z.literal("")),
  commissionPercentage: z.coerce.number().min(0).max(100),
  notes: z.string().optional().or(z.literal("")),
  status: z.boolean(),
});

export type ReferralSourceFormSchemaType = z.infer<typeof referralSourceFormSchema>;

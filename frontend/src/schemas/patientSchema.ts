import { z } from "zod";

const MOBILE_REGEX = /^[6-9]\d{9}$/;

export const patientFormSchema = z.object({
  optionalPatientId: z.string().optional().or(z.literal("")),
  title: z.string().min(1, "Required"),
  fullName: z.string().min(2, "Enter full name"),
  gender: z.enum(["Male", "Female", "Other"], { message: "Select gender" }),
  patientType: z.enum(["Retail", "B2B"], { message: "Select patient type" }),
  dob: z.string().min(1, "Select date of birth"),

  mobile: z
    .string()
    .regex(MOBILE_REGEX, "Enter a valid 10-digit mobile number")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),

  centerId: z.string().optional().or(z.literal("")),
  homeCollection: z.boolean(),

  organization: z.string().optional().or(z.literal("")),
  referral: z.string().optional().or(z.literal("")),
  referralDoctorId: z.string().optional().or(z.literal("")),
  referralSourceId: z.string().optional().or(z.literal("")),

  whatsappOptIn: z.boolean(),
  smsOptIn: z.boolean(),
  emailOptIn: z.boolean(),

  discountPercent: z.coerce.number().min(0, "Min 0%").max(100, "Max 100%"),
  paymentMode: z.enum(["Cash", "Card", "UPI", "Insurance", "Credit"]),
  amountPaid: z.coerce.number().min(0, "Cannot be negative"),
});

export type PatientFormSchema = z.infer<typeof patientFormSchema>;

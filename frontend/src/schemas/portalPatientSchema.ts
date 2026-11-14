import { z } from "zod";

const MOBILE_REGEX = /^[6-9]\d{9}$/;

export const portalPatientFormSchema = z.object({
  title: z.string().min(1, "Required"),
  fullName: z.string().min(2, "Enter full name"),
  gender: z.enum(["Male", "Female", "Other"], { message: "Select gender" }),
  dob: z.string().min(1, "Select date of birth"),
  mobile: z
    .string()
    .regex(MOBILE_REGEX, "Enter a valid 10-digit mobile number")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  whatsappOptIn: z.boolean(),
  smsOptIn: z.boolean(),
  emailOptIn: z.boolean(),

  testIds: z.array(z.string()).min(1, "Select at least one test"),
  discountPercent: z.coerce.number().min(0, "Min 0%").max(100, "Max 100%"),
  paymentMode: z.enum(["Cash", "Card", "UPI", "Insurance", "Credit", "Online"]),
  amountPaid: z.coerce.number().min(0, "Cannot be negative"),
  isEmergency: z.boolean(),
});

export type PortalPatientFormSchemaType = z.infer<typeof portalPatientFormSchema>;

import { z } from "zod";

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const DELIVERY_CHANNELS = ["WHATSAPP", "EMAIL", "SMS"] as const;
const ORGANIZATION_MODULES = ["patients", "samples", "reports", "invoices"] as const;

export const organizationFormSchema = z.object({
  name: z.string().min(2, "Enter organization name").max(150),
  type: z.enum(["GENERAL_CENTER", "COLLECTION_CENTER"], { message: "Select organization type" }),
  contactPerson: z.string().max(150).optional().or(z.literal("")),
  mobile: z.string().regex(MOBILE_REGEX, "Enter a valid 10-digit mobile number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  pincode: z.string().max(10).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),

  priceListId: z.string().optional().or(z.literal("")),
  paymentType: z.enum(["PREPAID", "POSTPAID"]),
  creditLimit: z.coerce.number().min(0, "Cannot be negative"),
  advanceAmount: z.coerce.number().min(0, "Cannot be negative"),
  dueDays: z.coerce.number().min(0, "Cannot be negative").max(365, "Max 365 days"),
  source: z.string().max(150).optional().or(z.literal("")),
  billingRules: z.string().optional().or(z.literal("")),
  invoiceRules: z.string().optional().or(z.literal("")),
  reportDeliveryChannels: z.array(z.enum(DELIVERY_CHANNELS)),
  billDeliveryChannels: z.array(z.enum(DELIVERY_CHANNELS)),

  active: z.boolean(),
});

export type OrganizationFormSchemaType = z.infer<typeof organizationFormSchema>;

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_POLICY_MESSAGE =
  "8+ characters, with an uppercase letter, a lowercase letter, a number, and a special character";

export const enableLoginFormSchema = z.object({
  username: z.string().min(3, "Enter a username").max(100),
  password: z.string().regex(PASSWORD_POLICY_REGEX, PASSWORD_POLICY_MESSAGE),
  roleId: z.string().min(1, "Select a role"),
  enabledModules: z.array(z.enum(ORGANIZATION_MODULES)),
});

export type EnableLoginFormSchemaType = z.infer<typeof enableLoginFormSchema>;

export const updateLoginFormSchema = z.object({
  roleId: z.string().min(1, "Select a role"),
  isActive: z.boolean(),
  password: z
    .string()
    .regex(PASSWORD_POLICY_REGEX, PASSWORD_POLICY_MESSAGE)
    .optional()
    .or(z.literal("")),
  enabledModules: z.array(z.enum(ORGANIZATION_MODULES)),
});

export type UpdateLoginFormSchemaType = z.infer<typeof updateLoginFormSchema>;

export const priceListFormSchema = z.object({
  name: z.string().min(2, "Enter price list name").max(150),
  description: z.string().optional().or(z.literal("")),
  active: z.boolean(),
});

export type PriceListFormSchemaType = z.infer<typeof priceListFormSchema>;

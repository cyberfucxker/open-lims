import { z } from "zod";

export const departmentFormSchema = z.object({
  name: z.string().min(2, "Enter department name").max(100),
  code: z.string().max(20, "Keep it under 20 characters").optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  active: z.boolean(),
});

export type DepartmentFormSchemaType = z.infer<typeof departmentFormSchema>;

export const categoryFormSchema = z.object({
  departmentId: z.string().min(1, "Select department"),
  name: z.string().min(2, "Enter category name").max(100),
  code: z.string().max(20, "Keep it under 20 characters").optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  active: z.boolean(),
});

export type CategoryFormSchemaType = z.infer<typeof categoryFormSchema>;

export const sampleTypeFormSchema = z.object({
  name: z.string().min(2, "Enter sample type name").max(100),
  description: z.string().optional().or(z.literal("")),
  active: z.boolean(),
});

export type SampleTypeFormSchemaType = z.infer<typeof sampleTypeFormSchema>;

export const centerFormSchema = z.object({
  name: z.string().min(2, "Enter center name").max(150),
  code: z.string().max(20, "Keep it under 20 characters").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  active: z.boolean(),
});

export type CenterFormSchemaType = z.infer<typeof centerFormSchema>;

export const containerFormSchema = z.object({
  name: z.string().min(2, "Enter container name").max(100),
  code: z.string().max(20, "Keep it under 20 characters").optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Pick a color")
    .optional()
    .or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  active: z.boolean(),
});

export type ContainerFormSchemaType = z.infer<typeof containerFormSchema>;

const TEMPERATURE_REQUIREMENTS = [
  "ROOM_TEMPERATURE",
  "REFRIGERATED_2_8",
  "FROZEN_MINUS20",
  "FROZEN_MINUS80",
] as const;

export const testSampleRuleFormSchema = z.object({
  containerId: z.string().optional().or(z.literal("")),
  requiresFasting: z.boolean(),
  fastingHours: z.coerce.number().min(0).max(72).optional(),
  isStatAllowed: z.boolean(),
  temperatureRequirement: z.enum(TEMPERATURE_REQUIREMENTS),
  minVolumeMl: z.coerce.number().min(0).optional(),
  volumeUnit: z.string().max(10),
  preparationInstructions: z.string().optional().or(z.literal("")),
  collectionInstructions: z.string().optional().or(z.literal("")),
  postCollectionInstructions: z.string().optional().or(z.literal("")),
});

export type TestSampleRuleFormSchemaType = z.infer<typeof testSampleRuleFormSchema>;

export const barcodeConfigFormSchema = z.object({
  prefix: z
    .string()
    .min(1, "Enter a prefix")
    .max(10, "Keep it under 10 characters")
    .regex(/^[A-Za-z0-9]+$/, "Prefix must be alphanumeric"),
  numberLength: z.coerce.number().min(4).max(12),
  active: z.boolean(),
});

export type BarcodeConfigFormSchemaType = z.infer<typeof barcodeConfigFormSchema>;

export const testResultConfigFormSchema = z.object({
  unit: z.string().max(30).optional().or(z.literal("")),
  method: z.string().max(100).optional().or(z.literal("")),
  criticalLow: z.coerce.number().optional(),
  criticalHigh: z.coerce.number().optional(),
  decimalPrecision: z.coerce.number().min(0).max(6),
});

export type TestResultConfigFormSchemaType = z.infer<typeof testResultConfigFormSchema>;

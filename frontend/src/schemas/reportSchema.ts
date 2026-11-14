import { z } from "zod";

export const rejectReportFormSchema = z.object({
  reason: z.string().min(3, "Enter a reason").max(500),
});

export type RejectReportFormSchemaType = z.infer<typeof rejectReportFormSchema>;

export const cancelReportFormSchema = z.object({
  reason: z.string().min(3, "Enter a cancellation reason").max(500),
});

export type CancelReportFormSchemaType = z.infer<typeof cancelReportFormSchema>;

const BARCODE_POSITIONS = ["TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT"] as const;
const WATERMARK_MODES = ["NONE", "TEXT", "IMAGE"] as const;
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

const patientFieldsSchema = z.object({
  patientId: z.boolean(),
  ageGender: z.boolean(),
  mobile: z.boolean(),
  billNo: z.boolean(),
  reportDate: z.boolean(),
  approvedDate: z.boolean(),
  emergency: z.boolean(),
  status: z.boolean(),
});

const reportFieldsSchema = z.object({
  unit: z.boolean(),
  referenceRange: z.boolean(),
  method: z.boolean(),
  remarks: z.boolean(),
  flag: z.boolean(),
});

export const reportSettingsFormSchema = z.object({
  labName: z.string().max(150).optional().or(z.literal("")),
  primaryColor: z.string().regex(HEX_COLOR, "Pick a color"),
  headerText: z.string().optional().or(z.literal("")),
  footerText: z.string().optional().or(z.literal("")),
  showFooter: z.boolean(),
  watermarkMode: z.enum(WATERMARK_MODES),
  watermarkText: z.string().max(100).optional().or(z.literal("")),
  showSignature: z.boolean(),
  minSignaturesRequired: z.coerce.number().int().min(1).max(5),
  showBarcode: z.boolean(),
  showQrCode: z.boolean(),
  barcodePosition: z.enum(BARCODE_POSITIONS),
  showPageNumber: z.boolean(),
  marginTop: z.coerce.number().min(0).max(200),
  marginRight: z.coerce.number().min(0).max(200),
  marginBottom: z.coerce.number().min(0).max(200),
  marginLeft: z.coerce.number().min(0).max(200),
  lineSpacing: z.coerce.number().min(0.8).max(2.5),
  fontSize: z.coerce.number().min(6).max(18),
  pageSize: z.enum(["A4", "LETTER"]),
  patientFields: patientFieldsSchema,
  reportFields: reportFieldsSchema,
});

export type ReportSettingsFormSchemaType = z.infer<typeof reportSettingsFormSchema>;

export type BarcodePosition = "TOP_LEFT" | "TOP_RIGHT" | "BOTTOM_LEFT" | "BOTTOM_RIGHT";
export type WatermarkMode = "NONE" | "TEXT" | "IMAGE";
export type ReportAssetType = "logo" | "header" | "footer" | "watermark" | "signature";

export const REPORT_ASSET_TYPES: ReportAssetType[] = [
  "logo",
  "header",
  "footer",
  "watermark",
  "signature",
];

export interface PatientFieldToggles {
  patientId: boolean;
  ageGender: boolean;
  mobile: boolean;
  billNo: boolean;
  reportDate: boolean;
  approvedDate: boolean;
  emergency: boolean;
  status: boolean;
}

export interface ReportFieldToggles {
  unit: boolean;
  referenceRange: boolean;
  method: boolean;
  remarks: boolean;
  flag: boolean;
}

/** `mobile` defaults false (a genuinely new field); every other key defaults
 *  true because that's what the report PDF already always rendered — an
 *  existing install sees no visual change until an admin opts in. */
export const DEFAULT_PATIENT_FIELDS: PatientFieldToggles = {
  patientId: true,
  ageGender: true,
  mobile: false,
  billNo: true,
  reportDate: true,
  approvedDate: true,
  emergency: true,
  status: true,
};

export const DEFAULT_REPORT_FIELDS: ReportFieldToggles = {
  unit: true,
  referenceRange: true,
  method: true,
  remarks: true,
  flag: true,
};

/** One source of truth for both "merge a possibly-partial Json column over
 *  sensible defaults" (read path) and "Restore Default" (write path). */
export const REPORT_SETTINGS_DEFAULTS = {
  labName: null as string | null,
  primaryColor: "#0B1E39",
  headerText: null as string | null,
  headerImagePath: null as string | null,
  footerText: null as string | null,
  footerImagePath: null as string | null,
  showFooter: true,
  logoPath: null as string | null,
  watermarkMode: "NONE" as WatermarkMode,
  watermarkText: null as string | null,
  watermarkImagePath: null as string | null,
  signaturePath: null as string | null,
  showSignature: true,
  minSignaturesRequired: 1,
  showBarcode: true,
  showQrCode: true,
  barcodePosition: "TOP_RIGHT" as BarcodePosition,
  showPageNumber: true,
  marginTop: 40,
  marginRight: 40,
  marginBottom: 40,
  marginLeft: 40,
  lineSpacing: 1.0,
  fontSize: 9,
  pageSize: "A4",
  patientFields: DEFAULT_PATIENT_FIELDS,
  reportFields: DEFAULT_REPORT_FIELDS,
};

export interface ReportSettingsDto {
  labName: string | null;
  primaryColor: string;
  headerText: string | null;
  headerImagePath: string | null;
  footerText: string | null;
  footerImagePath: string | null;
  showFooter: boolean;
  logoPath: string | null;
  watermarkMode: WatermarkMode;
  watermarkText: string | null;
  watermarkImagePath: string | null;
  signaturePath: string | null;
  showSignature: boolean;
  minSignaturesRequired: number;
  showBarcode: boolean;
  showQrCode: boolean;
  barcodePosition: BarcodePosition;
  showPageNumber: boolean;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  lineSpacing: number;
  fontSize: number;
  pageSize: string;
  patientFields: PatientFieldToggles;
  reportFields: ReportFieldToggles;
  updatedAt: string;
}

export interface ReportSettingsWriteData {
  labName?: string | null;
  primaryColor?: string;
  headerText?: string | null;
  footerText?: string | null;
  showFooter?: boolean;
  watermarkMode?: WatermarkMode;
  watermarkText?: string | null;
  showSignature?: boolean;
  minSignaturesRequired?: number;
  showBarcode?: boolean;
  showQrCode?: boolean;
  barcodePosition?: BarcodePosition;
  showPageNumber?: boolean;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  lineSpacing?: number;
  fontSize?: number;
  pageSize?: string;
  patientFields?: Partial<PatientFieldToggles>;
  reportFields?: Partial<ReportFieldToggles>;
}

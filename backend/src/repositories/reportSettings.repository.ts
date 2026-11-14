import type { Prisma, ReportSettings } from "@prisma/client";
import { prisma } from "../config/database";
import {
  DEFAULT_PATIENT_FIELDS,
  DEFAULT_REPORT_FIELDS,
  REPORT_SETTINGS_DEFAULTS,
  type PatientFieldToggles,
  type ReportAssetType,
  type ReportFieldToggles,
  type ReportSettingsDto,
  type ReportSettingsWriteData,
} from "../types/reportSettings.types";

const SINGLETON_ID = "default";

type AssetColumn =
  "logoPath" | "headerImagePath" | "footerImagePath" | "watermarkImagePath" | "signaturePath";

/** Column each upload endpoint's asset type writes to. Plain scalar-field
 *  object (not typed as a Prisma Update/Create input) so the same value is
 *  usable in both an `update` and a `create` call. */
function assetColumn(assetType: ReportAssetType): AssetColumn {
  switch (assetType) {
    case "logo":
      return "logoPath";
    case "header":
      return "headerImagePath";
    case "footer":
      return "footerImagePath";
    case "watermark":
      return "watermarkImagePath";
    case "signature":
      return "signaturePath";
  }
}

function mergeToggles<T>(defaults: T, stored: Prisma.JsonValue): T {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return defaults;
  return { ...defaults, ...(stored as Partial<T>) };
}

/** `patientFields`/`reportFields` are plain `Record<string, boolean>`-shaped
 *  objects at runtime but their TS interfaces have no index signature (so
 *  each key stays individually typed) — Prisma's `Json` input type needs an
 *  index-signature-bearing value, so this cast is the one place that gap is
 *  bridged. */
function toJsonInput(
  value: Partial<PatientFieldToggles> | Partial<ReportFieldToggles> | undefined,
): Prisma.InputJsonValue | undefined {
  return value as Prisma.InputJsonValue | undefined;
}

export function toReportSettingsDto(settings: ReportSettings): ReportSettingsDto {
  return {
    labName: settings.labName,
    primaryColor: settings.primaryColor,
    headerText: settings.headerText,
    headerImagePath: settings.headerImagePath,
    footerText: settings.footerText,
    footerImagePath: settings.footerImagePath,
    showFooter: settings.showFooter,
    logoPath: settings.logoPath,
    watermarkMode: settings.watermarkMode as ReportSettingsDto["watermarkMode"],
    watermarkText: settings.watermarkText,
    watermarkImagePath: settings.watermarkImagePath,
    signaturePath: settings.signaturePath,
    showSignature: settings.showSignature,
    minSignaturesRequired: settings.minSignaturesRequired,
    showBarcode: settings.showBarcode,
    showQrCode: settings.showQrCode,
    barcodePosition: settings.barcodePosition as ReportSettingsDto["barcodePosition"],
    showPageNumber: settings.showPageNumber,
    marginTop: settings.marginTop,
    marginRight: settings.marginRight,
    marginBottom: settings.marginBottom,
    marginLeft: settings.marginLeft,
    lineSpacing: settings.lineSpacing,
    fontSize: settings.fontSize,
    pageSize: settings.pageSize,
    patientFields: mergeToggles<PatientFieldToggles>(
      DEFAULT_PATIENT_FIELDS,
      settings.patientFields,
    ),
    reportFields: mergeToggles<ReportFieldToggles>(DEFAULT_REPORT_FIELDS, settings.reportFields),
    updatedAt: settings.updatedAt.toISOString(),
  };
}

/** GET auto-creates the default row on first read — no seed migration data
 *  needed for a table that only ever has one row. */
export function getOrCreateReportSettings() {
  return prisma.reportSettings.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });
}

export function updateReportSettings(
  data: ReportSettingsWriteData & { updatedByUserId?: string | null },
) {
  const { patientFields, reportFields, ...rest } = data;
  const jsonData = {
    ...rest,
    ...(patientFields !== undefined ? { patientFields: toJsonInput(patientFields) } : {}),
    ...(reportFields !== undefined ? { reportFields: toJsonInput(reportFields) } : {}),
  };

  return prisma.reportSettings.upsert({
    where: { id: SINGLETON_ID },
    update: jsonData,
    create: { id: SINGLETON_ID, ...jsonData },
  });
}

export function updateReportSettingsAsset(
  assetType: ReportAssetType,
  path: string,
  updatedByUserId?: string | null,
) {
  const column = assetColumn(assetType);
  return prisma.reportSettings.upsert({
    where: { id: SINGLETON_ID },
    update: { [column]: path, updatedByUserId },
    create: { id: SINGLETON_ID, [column]: path, updatedByUserId },
  });
}

/** Resets every field to `REPORT_SETTINGS_DEFAULTS` — uploaded asset files
 *  themselves are left on disk (nothing in this codebase deletes orphaned
 *  uploads on removal), only the DB references are cleared. */
export function restoreDefaultReportSettings(updatedByUserId?: string | null) {
  const data = {
    ...REPORT_SETTINGS_DEFAULTS,
    patientFields: toJsonInput(REPORT_SETTINGS_DEFAULTS.patientFields),
    reportFields: toJsonInput(REPORT_SETTINGS_DEFAULTS.reportFields),
    updatedByUserId,
  };
  return prisma.reportSettings.upsert({
    where: { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...data },
  });
}

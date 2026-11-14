import * as reportSettingsRepository from "../repositories/reportSettings.repository";
import { toReportSettingsDto } from "../repositories/reportSettings.repository";
import type {
  ReportAssetType,
  ReportSettingsDto,
  ReportSettingsWriteData,
} from "../types/reportSettings.types";

export async function getReportSettings(): Promise<ReportSettingsDto> {
  const settings = await reportSettingsRepository.getOrCreateReportSettings();
  return toReportSettingsDto(settings);
}

export async function updateReportSettings(
  values: ReportSettingsWriteData,
  updatedByUserId: string | null,
): Promise<ReportSettingsDto> {
  const settings = await reportSettingsRepository.updateReportSettings({
    ...values,
    updatedByUserId,
  });
  return toReportSettingsDto(settings);
}

export async function uploadReportAsset(
  assetType: ReportAssetType,
  path: string,
  updatedByUserId: string | null,
): Promise<ReportSettingsDto> {
  const settings = await reportSettingsRepository.updateReportSettingsAsset(
    assetType,
    path,
    updatedByUserId,
  );
  return toReportSettingsDto(settings);
}

export async function restoreDefaultReportSettings(
  updatedByUserId: string | null,
): Promise<ReportSettingsDto> {
  const settings = await reportSettingsRepository.restoreDefaultReportSettings(updatedByUserId);
  return toReportSettingsDto(settings);
}

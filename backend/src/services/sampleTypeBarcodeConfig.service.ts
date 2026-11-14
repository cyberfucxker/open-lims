import { ApiError } from "../utils/ApiError";
import * as sampleTypeBarcodeConfigRepository from "../repositories/sampleTypeBarcodeConfig.repository";
import { toSampleTypeBarcodeConfigDto } from "../repositories/sampleTypeBarcodeConfig.repository";
import type {
  ListMasterParams,
  ListSampleTypeBarcodeConfigsResult,
  SampleTypeBarcodeConfigDto,
  SampleTypeBarcodeConfigWriteData,
} from "../types/master.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export async function listSampleTypeBarcodeConfigs(
  params: ListMasterParams,
): Promise<ListSampleTypeBarcodeConfigsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await sampleTypeBarcodeConfigRepository.listSampleTypeBarcodeConfigs({
    search: params.search,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toSampleTypeBarcodeConfigDto), total };
}

export async function getSampleTypeBarcodeConfig(
  sampleTypeId: string,
): Promise<SampleTypeBarcodeConfigDto> {
  const sampleType =
    await sampleTypeBarcodeConfigRepository.findSampleTypeWithConfigById(sampleTypeId);
  if (!sampleType) {
    throw ApiError.notFound("Sample type not found");
  }
  return toSampleTypeBarcodeConfigDto(sampleType);
}

export async function upsertSampleTypeBarcodeConfig(
  sampleTypeId: string,
  values: SampleTypeBarcodeConfigWriteData,
): Promise<SampleTypeBarcodeConfigDto> {
  const sampleType =
    await sampleTypeBarcodeConfigRepository.findSampleTypeWithConfigById(sampleTypeId);
  if (!sampleType) {
    throw ApiError.notFound("Sample type not found");
  }

  await sampleTypeBarcodeConfigRepository.upsertSampleTypeBarcodeConfig(sampleTypeId, {
    ...values,
    active: values.active ?? true,
  });

  return getSampleTypeBarcodeConfig(sampleTypeId);
}

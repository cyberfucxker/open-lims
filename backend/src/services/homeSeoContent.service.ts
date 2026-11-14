import * as homeSeoContentRepository from "../repositories/homeSeoContent.repository";
import { toHomeSeoContentDto } from "../repositories/homeSeoContent.repository";
import type { HomeSeoContentDto, HomeSeoContentWriteData } from "../types/homeSeoContent.types";

export async function getHomeSeoContent(): Promise<HomeSeoContentDto> {
  const row = await homeSeoContentRepository.getOrCreateHomeSeoContent();
  return toHomeSeoContentDto(row);
}

export async function updateHomeSeoContent(
  values: HomeSeoContentWriteData,
): Promise<HomeSeoContentDto> {
  const row = await homeSeoContentRepository.updateHomeSeoContent(values);
  return toHomeSeoContentDto(row);
}

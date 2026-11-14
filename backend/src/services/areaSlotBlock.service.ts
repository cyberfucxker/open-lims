import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as areaSlotBlockRepository from "../repositories/areaSlotBlock.repository";
import {
  toAreaSlotBlockDto,
  type AreaSlotBlockWriteInput,
  type BulkCreateAreaSlotBlocksInput,
} from "../repositories/areaSlotBlock.repository";
import type { AreaSlotBlockDto, ListAreaSlotBlocksParams } from "../types/areaSlotBlock.types";

export async function listAreaSlotBlocks(
  params: ListAreaSlotBlocksParams,
): Promise<AreaSlotBlockDto[]> {
  const rows = await areaSlotBlockRepository.listAreaSlotBlocks(params);
  return rows.map(toAreaSlotBlockDto);
}

export async function createAreaSlotBlock(
  values: AreaSlotBlockWriteInput,
): Promise<AreaSlotBlockDto> {
  try {
    const block = await areaSlotBlockRepository.createAreaSlotBlock(values);
    return toAreaSlotBlockDto(block);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw ApiError.conflict("This slot is already blocked for this area and date");
      }
      if (error.code === "P2003") {
        throw ApiError.badRequest("Selected area or slot template does not exist");
      }
    }
    throw error;
  }
}

export async function deleteAreaSlotBlock(id: string): Promise<void> {
  try {
    await areaSlotBlockRepository.deleteAreaSlotBlock(id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Area slot block not found");
    }
    throw error;
  }
}

export async function createAreaSlotBlocksBulk(
  values: BulkCreateAreaSlotBlocksInput,
): Promise<AreaSlotBlockDto[]> {
  try {
    const blocks = await areaSlotBlockRepository.createAreaSlotBlocksBulk(values);
    return blocks.map(toAreaSlotBlockDto);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw ApiError.badRequest("Selected area or one of the slot templates does not exist");
    }
    throw error;
  }
}

export async function deleteAreaSlotBlocksBulk(ids: string[]): Promise<number> {
  const result = await areaSlotBlockRepository.deleteAreaSlotBlocksBulk(ids);
  return result.count;
}

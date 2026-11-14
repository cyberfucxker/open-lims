import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as slotBlockRepository from "../repositories/slotBlock.repository";
import {
  toSlotBlockDto,
  type BulkCreateSlotBlocksInput,
  type SlotBlockWriteInput,
} from "../repositories/slotBlock.repository";
import type { ListSlotBlocksParams, SlotBlockDto } from "../types/slotBlock.types";

export async function listSlotBlocks(params: ListSlotBlocksParams): Promise<SlotBlockDto[]> {
  const rows = await slotBlockRepository.listSlotBlocks(params);
  return rows.map(toSlotBlockDto);
}

export async function createSlotBlock(values: SlotBlockWriteInput): Promise<SlotBlockDto> {
  try {
    const block = await slotBlockRepository.createSlotBlock(values);
    return toSlotBlockDto(block);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw ApiError.conflict("This slot is already blocked for this city and date");
      }
      if (error.code === "P2003") {
        throw ApiError.badRequest("Selected city or slot template does not exist");
      }
    }
    throw error;
  }
}

export async function deleteSlotBlock(id: string): Promise<void> {
  try {
    await slotBlockRepository.deleteSlotBlock(id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Slot block not found");
    }
    throw error;
  }
}

export async function createSlotBlocksBulk(
  values: BulkCreateSlotBlocksInput,
): Promise<SlotBlockDto[]> {
  try {
    const blocks = await slotBlockRepository.createSlotBlocksBulk(values);
    return blocks.map(toSlotBlockDto);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw ApiError.badRequest("Selected city or one of the slot templates does not exist");
    }
    throw error;
  }
}

export async function deleteSlotBlocksBulk(ids: string[]): Promise<number> {
  const result = await slotBlockRepository.deleteSlotBlocksBulk(ids);
  return result.count;
}

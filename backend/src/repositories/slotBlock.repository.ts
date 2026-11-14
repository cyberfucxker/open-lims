import type { Prisma, SlotBlock } from "@prisma/client";
import { prisma } from "../config/database";
import type { SlotBlockDto } from "../types/slotBlock.types";

type SlotBlockWithRelations = SlotBlock & {
  city: { name: string };
  slotTemplate: { title: string };
};

export interface ListSlotBlocksFilter {
  cityId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SlotBlockWriteInput {
  cityId: string;
  slotTemplateId: string;
  blockDate: string;
  reason?: string | null;
}

export function toSlotBlockDto(block: SlotBlockWithRelations): SlotBlockDto {
  return {
    id: block.id,
    cityId: block.cityId,
    cityName: block.city.name,
    slotTemplateId: block.slotTemplateId,
    slotTemplateTitle: block.slotTemplate.title,
    blockDate: block.blockDate.toISOString().slice(0, 10),
    reason: block.reason,
    createdAt: block.createdAt.toISOString(),
  };
}

const include = {
  city: { select: { name: true } },
  slotTemplate: { select: { title: true } },
} satisfies Prisma.SlotBlockInclude;

export async function listSlotBlocks(
  filter: ListSlotBlocksFilter,
): Promise<SlotBlockWithRelations[]> {
  const where: Prisma.SlotBlockWhereInput = {};
  if (filter.cityId) where.cityId = filter.cityId;
  if (filter.dateFrom || filter.dateTo) {
    where.blockDate = {
      ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
      ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
    };
  }

  return prisma.slotBlock.findMany({ where, include, orderBy: { blockDate: "asc" } });
}

export function createSlotBlock(data: SlotBlockWriteInput) {
  return prisma.slotBlock.create({
    data: { ...data, blockDate: new Date(data.blockDate) },
    include,
  });
}

export interface BulkCreateSlotBlocksInput {
  cityId: string;
  blockDate: string;
  slotTemplateIds: string[];
  reason?: string | null;
}

/** Creates one row per template for the city+date, silently skipping any
 *  that already exist (same @@unique as the single-create path) rather
 *  than failing the whole batch on one duplicate. */
export async function createSlotBlocksBulk(
  data: BulkCreateSlotBlocksInput,
): Promise<SlotBlockWithRelations[]> {
  const blockDate = new Date(data.blockDate);
  await prisma.slotBlock.createMany({
    data: data.slotTemplateIds.map((slotTemplateId) => ({
      cityId: data.cityId,
      slotTemplateId,
      blockDate,
      reason: data.reason ?? null,
    })),
    skipDuplicates: true,
  });

  return prisma.slotBlock.findMany({
    where: { cityId: data.cityId, blockDate, slotTemplateId: { in: data.slotTemplateIds } },
    include,
  });
}

export function deleteSlotBlock(id: string) {
  return prisma.slotBlock.delete({ where: { id } });
}

export function deleteSlotBlocksBulk(ids: string[]) {
  return prisma.slotBlock.deleteMany({ where: { id: { in: ids } } });
}

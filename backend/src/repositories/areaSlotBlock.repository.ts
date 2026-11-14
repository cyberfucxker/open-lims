import type { AreaSlotBlock, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { AreaSlotBlockDto } from "../types/areaSlotBlock.types";

type AreaSlotBlockWithRelations = AreaSlotBlock & {
  area: { name: string };
  slotTemplate: { title: string };
};

export interface ListAreaSlotBlocksFilter {
  areaId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AreaSlotBlockWriteInput {
  areaId: string;
  slotTemplateId: string;
  blockDate: string;
  reason?: string | null;
}

export function toAreaSlotBlockDto(block: AreaSlotBlockWithRelations): AreaSlotBlockDto {
  return {
    id: block.id,
    areaId: block.areaId,
    areaName: block.area.name,
    slotTemplateId: block.slotTemplateId,
    slotTemplateTitle: block.slotTemplate.title,
    blockDate: block.blockDate.toISOString().slice(0, 10),
    reason: block.reason,
    createdAt: block.createdAt.toISOString(),
  };
}

const include = {
  area: { select: { name: true } },
  slotTemplate: { select: { title: true } },
} satisfies Prisma.AreaSlotBlockInclude;

export async function listAreaSlotBlocks(
  filter: ListAreaSlotBlocksFilter,
): Promise<AreaSlotBlockWithRelations[]> {
  const where: Prisma.AreaSlotBlockWhereInput = {};
  if (filter.areaId) where.areaId = filter.areaId;
  if (filter.dateFrom || filter.dateTo) {
    where.blockDate = {
      ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
      ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
    };
  }

  return prisma.areaSlotBlock.findMany({ where, include, orderBy: { blockDate: "asc" } });
}

export function createAreaSlotBlock(data: AreaSlotBlockWriteInput) {
  return prisma.areaSlotBlock.create({
    data: { ...data, blockDate: new Date(data.blockDate) },
    include,
  });
}

export interface BulkCreateAreaSlotBlocksInput {
  areaId: string;
  blockDate: string;
  slotTemplateIds: string[];
  reason?: string | null;
}

/** Creates one row per template for the area+date, silently skipping any
 *  that already exist (same @@unique as the single-create path) rather
 *  than failing the whole batch on one duplicate. */
export async function createAreaSlotBlocksBulk(
  data: BulkCreateAreaSlotBlocksInput,
): Promise<AreaSlotBlockWithRelations[]> {
  const blockDate = new Date(data.blockDate);
  await prisma.areaSlotBlock.createMany({
    data: data.slotTemplateIds.map((slotTemplateId) => ({
      areaId: data.areaId,
      slotTemplateId,
      blockDate,
      reason: data.reason ?? null,
    })),
    skipDuplicates: true,
  });

  return prisma.areaSlotBlock.findMany({
    where: { areaId: data.areaId, blockDate, slotTemplateId: { in: data.slotTemplateIds } },
    include,
  });
}

export function deleteAreaSlotBlock(id: string) {
  return prisma.areaSlotBlock.delete({ where: { id } });
}

export function deleteAreaSlotBlocksBulk(ids: string[]) {
  return prisma.areaSlotBlock.deleteMany({ where: { id: { in: ids } } });
}

import type { Prisma, SlotTemplate } from "@prisma/client";
import { prisma } from "../config/database";
import type { SlotTemplateDto } from "../types/slotTemplate.types";

export interface ListSlotTemplatesFilter {
  search?: string;
  active?: string;
  skip: number;
  take: number;
}

export interface SlotTemplateWriteInput {
  title: string;
  startTime: string;
  endTime: string;
  defaultCapacity?: number;
  active?: boolean;
}

export function toSlotTemplateDto(template: SlotTemplate): SlotTemplateDto {
  return {
    id: template.id,
    title: template.title,
    startTime: template.startTime,
    endTime: template.endTime,
    defaultCapacity: template.defaultCapacity,
    active: template.active,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListSlotTemplatesFilter, "search" | "active">,
): Prisma.SlotTemplateWhereInput {
  const where: Prisma.SlotTemplateWhereInput = {};

  if (filter.search) {
    where.title = { contains: filter.search, mode: "insensitive" };
  }
  if (filter.active === "true") {
    where.active = true;
  } else if (filter.active === "false") {
    where.active = false;
  }

  return where;
}

export async function listSlotTemplates(
  filter: ListSlotTemplatesFilter,
): Promise<{ rows: SlotTemplate[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.slotTemplate.findMany({
      where,
      orderBy: { startTime: "asc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.slotTemplate.count({ where }),
  ]);

  return { rows, total };
}

export function listActiveSlotTemplates() {
  return prisma.slotTemplate.findMany({ where: { active: true }, orderBy: { startTime: "asc" } });
}

export function findSlotTemplateById(id: string) {
  return prisma.slotTemplate.findUnique({ where: { id } });
}

export function createSlotTemplate(data: SlotTemplateWriteInput) {
  return prisma.slotTemplate.create({
    data: { ...data, defaultCapacity: data.defaultCapacity ?? 1, active: data.active ?? true },
  });
}

export function updateSlotTemplate(id: string, data: SlotTemplateWriteInput) {
  return prisma.slotTemplate.update({ where: { id }, data });
}

export function setSlotTemplateActive(id: string, active: boolean) {
  return prisma.slotTemplate.update({ where: { id }, data: { active } });
}

/** Guard used by the service layer before allowing a hard delete: a
 *  template still assigned to any city, or still referenced by a future
 *  non-cancelled order, must be deactivated instead. */
export async function isSlotTemplateInUse(id: string): Promise<boolean> {
  const [assignment, futureOrder] = await Promise.all([
    prisma.citySlotTemplate.findFirst({ where: { slotTemplateId: id } }),
    prisma.appOrder.findFirst({
      where: {
        slotTemplateId: id,
        status: { notIn: ["CANCELLED"] },
        orderDate: { gte: new Date(new Date().toISOString().slice(0, 10)) },
      },
    }),
  ]);
  return Boolean(assignment || futureOrder);
}

export function deleteSlotTemplate(id: string) {
  return prisma.slotTemplate.delete({ where: { id } });
}

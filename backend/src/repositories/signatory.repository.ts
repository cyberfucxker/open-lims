import type { Prisma, Signatory } from "@prisma/client";
import { prisma } from "../config/database";
import type { SignatoryDto } from "../types/signatory.types";

export function toSignatoryDto(row: Signatory): SignatoryDto {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    signaturePath: row.signaturePath,
    hasPasskey: Boolean(row.passkeyHash),
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface ListSignatoriesFilter {
  search?: string;
  active?: string;
  skip: number;
  take: number;
}

function buildWhere(
  filter: Pick<ListSignatoriesFilter, "search" | "active">,
): Prisma.SignatoryWhereInput {
  const where: Prisma.SignatoryWhereInput = {};
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { title: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter.active === "true") where.active = true;
  if (filter.active === "false") where.active = false;
  return where;
}

export async function listSignatories(
  filter: ListSignatoriesFilter,
): Promise<{ rows: Signatory[]; total: number }> {
  const where = buildWhere(filter);
  const [rows, total] = await Promise.all([
    prisma.signatory.findMany({
      where,
      orderBy: { name: "asc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.signatory.count({ where }),
  ]);
  return { rows, total };
}

export function findSignatoryById(id: string) {
  return prisma.signatory.findUnique({ where: { id } });
}

export function createSignatory(data: Prisma.SignatoryCreateInput): Promise<Signatory> {
  return prisma.signatory.create({ data });
}

export function updateSignatory(id: string, data: Prisma.SignatoryUpdateInput): Promise<Signatory> {
  return prisma.signatory.update({ where: { id }, data });
}

export function updateSignatoryImage(id: string, signaturePath: string): Promise<Signatory> {
  return prisma.signatory.update({ where: { id }, data: { signaturePath } });
}

export function deleteSignatory(id: string): Promise<Signatory> {
  return prisma.signatory.delete({ where: { id } });
}

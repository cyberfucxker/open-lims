import type { CommissionSlab } from "@prisma/client";
import { prisma } from "../config/database";
import type { CommissionSlabDto } from "../types/commissionSlab.types";

export interface CommissionSlabWriteInput {
  fromAmount: number;
  toAmount?: number | null;
  percentage: number;
  active?: boolean;
}

export function toCommissionSlabDto(slab: CommissionSlab): CommissionSlabDto {
  return {
    id: slab.id,
    fromAmount: Number(slab.fromAmount),
    toAmount: slab.toAmount === null ? null : Number(slab.toAmount),
    percentage: Number(slab.percentage),
    active: slab.active,
    createdAt: slab.createdAt.toISOString(),
    updatedAt: slab.updatedAt.toISOString(),
  };
}

export function listCommissionSlabs() {
  return prisma.commissionSlab.findMany({ orderBy: { fromAmount: "asc" } });
}

/** Ordered so the first matching band (lowest fromAmount that still
 *  qualifies) is picked deterministically if bands were ever misconfigured
 *  to overlap. */
export function listActiveCommissionSlabsOrdered() {
  return prisma.commissionSlab.findMany({
    where: { active: true },
    orderBy: { fromAmount: "asc" },
  });
}

export function findCommissionSlabById(id: string) {
  return prisma.commissionSlab.findUnique({ where: { id } });
}

export function createCommissionSlab(data: CommissionSlabWriteInput) {
  return prisma.commissionSlab.create({ data: { ...data, active: data.active ?? true } });
}

export function updateCommissionSlab(id: string, data: CommissionSlabWriteInput) {
  return prisma.commissionSlab.update({ where: { id }, data });
}

export function deleteCommissionSlab(id: string) {
  return prisma.commissionSlab.delete({ where: { id } });
}

export function setCommissionSlabStatus(id: string, active: boolean) {
  return prisma.commissionSlab.update({ where: { id }, data: { active } });
}

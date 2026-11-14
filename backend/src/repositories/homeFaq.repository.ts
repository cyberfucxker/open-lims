import type { HomeFaq, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import type { HomeFaqDto } from "../types/homeFaq.types";

export interface ListHomeFaqsFilter {
  isActive?: string;
  skip: number;
  take: number;
}

export interface HomeFaqWriteInput {
  question: string;
  answer: string;
  isActive?: boolean;
}

export function toHomeFaqDto(faq: HomeFaq): HomeFaqDto {
  return {
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    sortOrder: faq.sortOrder,
    isActive: faq.isActive,
    createdAt: faq.createdAt.toISOString(),
    updatedAt: faq.updatedAt.toISOString(),
  };
}

function buildWhere(filter: Pick<ListHomeFaqsFilter, "isActive">): Prisma.HomeFaqWhereInput {
  const where: Prisma.HomeFaqWhereInput = {};

  if (filter.isActive === "true") {
    where.isActive = true;
  } else if (filter.isActive === "false") {
    where.isActive = false;
  }

  return where;
}

export async function listHomeFaqs(
  filter: ListHomeFaqsFilter,
): Promise<{ rows: HomeFaq[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.homeFaq.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.homeFaq.count({ where }),
  ]);

  return { rows, total };
}

/** Every active FAQ, in display order — the patient-app read path (no
 *  pagination; a Home FAQ list is meant to be short). */
export function listActiveHomeFaqs() {
  return prisma.homeFaq.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export function findHomeFaqById(id: string) {
  return prisma.homeFaq.findUnique({ where: { id } });
}

export async function nextSortOrder(): Promise<number> {
  const last = await prisma.homeFaq.findFirst({ orderBy: { sortOrder: "desc" } });
  return (last?.sortOrder ?? -1) + 1;
}

export async function createHomeFaq(data: HomeFaqWriteInput) {
  const sortOrder = await nextSortOrder();
  return prisma.homeFaq.create({
    data: {
      question: data.question,
      answer: data.answer,
      isActive: data.isActive ?? true,
      sortOrder,
    },
  });
}

export function updateHomeFaq(id: string, data: HomeFaqWriteInput) {
  return prisma.homeFaq.update({
    where: { id },
    data: { question: data.question, answer: data.answer, isActive: data.isActive },
  });
}

export function setHomeFaqStatus(id: string, isActive: boolean) {
  return prisma.homeFaq.update({ where: { id }, data: { isActive } });
}

export function deleteHomeFaq(id: string) {
  return prisma.homeFaq.delete({ where: { id } });
}

export function reorderHomeFaqs(ids: string[]) {
  return prisma.$transaction(
    ids.map((id, index) => prisma.homeFaq.update({ where: { id }, data: { sortOrder: index } })),
  );
}

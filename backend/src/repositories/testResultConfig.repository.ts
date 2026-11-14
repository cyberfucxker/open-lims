import type { Prisma, Test, TestResultConfig } from "@prisma/client";
import { prisma } from "../config/database";
import type { TestResultConfigDto, TestResultConfigWriteData } from "../types/master.types";

const withConfig = {
  resultConfig: true,
} satisfies Prisma.TestInclude;

type TestWithConfig = Test & { resultConfig: TestResultConfig | null };

export function toTestResultConfigDto(test: TestWithConfig): TestResultConfigDto {
  return {
    testId: test.id,
    testName: test.name,
    testShortName: test.shortName,
    config: test.resultConfig
      ? {
          unit: test.resultConfig.unit,
          method: test.resultConfig.method,
          criticalLow: test.resultConfig.criticalLow ? Number(test.resultConfig.criticalLow) : null,
          criticalHigh: test.resultConfig.criticalHigh
            ? Number(test.resultConfig.criticalHigh)
            : null,
          decimalPrecision: test.resultConfig.decimalPrecision,
          updatedAt: test.resultConfig.updatedAt.toISOString(),
        }
      : null,
  };
}

export interface ListTestResultConfigsFilter {
  search?: string;
  departmentId?: string;
  categoryId?: string;
  configured?: string;
  skip: number;
  take: number;
}

function buildWhere(
  filter: Pick<
    ListTestResultConfigsFilter,
    "search" | "departmentId" | "categoryId" | "configured"
  >,
): Prisma.TestWhereInput {
  // Auto-provisioned single-parameter Tests are excluded by default — same
  // reasoning as `test.repository.ts#buildWhere`. There are hundreds of them;
  // Report Settings for one is the Parameter's own fields, not a per-shadow-
  // Test override.
  const where: Prisma.TestWhereInput = { sourceParameterId: null };

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { shortName: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter.departmentId && filter.departmentId !== "all")
    where.departmentId = filter.departmentId;
  if (filter.categoryId && filter.categoryId !== "all") where.categoryId = filter.categoryId;
  if (filter.configured === "true") where.resultConfig = { isNot: null };
  if (filter.configured === "false") where.resultConfig = { is: null };

  return where;
}

export async function listTestResultConfigs(
  filter: ListTestResultConfigsFilter,
): Promise<{ rows: TestWithConfig[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.test.findMany({
      where,
      include: withConfig,
      orderBy: { name: "asc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.test.count({ where }),
  ]);

  return { rows, total };
}

export function findTestWithConfigById(testId: string) {
  return prisma.test.findUnique({ where: { id: testId }, include: withConfig });
}

export function upsertTestResultConfig(testId: string, data: TestResultConfigWriteData) {
  return prisma.testResultConfig.upsert({
    where: { testId },
    create: { testId, ...data },
    update: data,
  });
}

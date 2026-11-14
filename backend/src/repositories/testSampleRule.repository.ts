import type { Prisma, Test, TestSampleRule } from "@prisma/client";
import { prisma } from "../config/database";
import type {
  TemperatureRequirement,
  TestSampleRuleDto,
  TestSampleRuleWriteData,
} from "../types/master.types";

const withRelations = {
  sampleType: { select: { name: true } },
  sampleRule: { include: { container: { select: { name: true } } } },
} satisfies Prisma.TestInclude;

type TestWithRule = Test & {
  sampleType: { name: string };
  sampleRule: (TestSampleRule & { container: { name: string } | null }) | null;
};

export function toTestSampleRuleDto(test: TestWithRule): TestSampleRuleDto {
  return {
    testId: test.id,
    testName: test.name,
    testShortName: test.shortName,
    sampleType: test.sampleType.name,
    rule: test.sampleRule
      ? {
          containerId: test.sampleRule.containerId,
          containerName: test.sampleRule.container?.name ?? null,
          requiresFasting: test.sampleRule.requiresFasting,
          fastingHours: test.sampleRule.fastingHours,
          isStatAllowed: test.sampleRule.isStatAllowed,
          temperatureRequirement: test.sampleRule.temperatureRequirement as TemperatureRequirement,
          minVolumeMl: test.sampleRule.minVolumeMl ? Number(test.sampleRule.minVolumeMl) : null,
          volumeUnit: test.sampleRule.volumeUnit,
          preparationInstructions: test.sampleRule.preparationInstructions,
          collectionInstructions: test.sampleRule.collectionInstructions,
          postCollectionInstructions: test.sampleRule.postCollectionInstructions,
          updatedAt: test.sampleRule.updatedAt.toISOString(),
        }
      : null,
  };
}

export interface ListTestSampleRulesFilter {
  search?: string;
  departmentId?: string;
  categoryId?: string;
  sampleTypeId?: string;
  configured?: string;
  skip: number;
  take: number;
}

function buildWhere(
  filter: Pick<
    ListTestSampleRulesFilter,
    "search" | "departmentId" | "categoryId" | "sampleTypeId" | "configured"
  >,
): Prisma.TestWhereInput {
  // Auto-provisioned single-parameter Tests are excluded by default — same
  // reasoning as `test.repository.ts#buildWhere`. There are hundreds of
  // them; an admin configuring sample rules manages the analyte's own
  // Sample Type on the Parameter, not a per-shadow-Test override.
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
  if (filter.sampleTypeId && filter.sampleTypeId !== "all")
    where.sampleTypeId = filter.sampleTypeId;
  if (filter.configured === "true") where.sampleRule = { isNot: null };
  if (filter.configured === "false") where.sampleRule = { is: null };

  return where;
}

export async function listTestSampleRules(
  filter: ListTestSampleRulesFilter,
): Promise<{ rows: TestWithRule[]; total: number }> {
  const where = buildWhere(filter);

  const [rows, total] = await Promise.all([
    prisma.test.findMany({
      where,
      include: withRelations,
      orderBy: { name: "asc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.test.count({ where }),
  ]);

  return { rows, total };
}

export function findTestWithRuleById(testId: string) {
  return prisma.test.findUnique({ where: { id: testId }, include: withRelations });
}

export function upsertTestSampleRule(testId: string, data: TestSampleRuleWriteData) {
  return prisma.testSampleRule.upsert({
    where: { testId },
    create: { testId, ...data },
    update: data,
  });
}

import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import * as testSampleRuleRepository from "../repositories/testSampleRule.repository";
import { toTestSampleRuleDto } from "../repositories/testSampleRule.repository";
import type {
  ListTestSampleRulesParams,
  ListTestSampleRulesResult,
  TestSampleRuleDto,
  TestSampleRuleWriteData,
} from "../types/master.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export async function listTestSampleRules(
  params: ListTestSampleRulesParams,
): Promise<ListTestSampleRulesResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await testSampleRuleRepository.listTestSampleRules({
    search: params.search,
    departmentId: params.departmentId,
    categoryId: params.categoryId,
    sampleTypeId: params.sampleTypeId,
    configured: params.configured,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toTestSampleRuleDto), total };
}

export async function getTestSampleRule(testId: string): Promise<TestSampleRuleDto> {
  const test = await testSampleRuleRepository.findTestWithRuleById(testId);
  if (!test) {
    throw ApiError.notFound("Test not found");
  }
  return toTestSampleRuleDto(test);
}

export async function upsertTestSampleRule(
  testId: string,
  values: TestSampleRuleWriteData,
): Promise<TestSampleRuleDto> {
  const test = await testSampleRuleRepository.findTestWithRuleById(testId);
  if (!test) {
    throw ApiError.notFound("Test not found");
  }

  if (values.containerId) {
    const container = await prisma.container.findFirst({
      where: { id: values.containerId, deletedAt: null },
    });
    if (!container) {
      throw ApiError.badRequest("Selected container does not exist");
    }
  }

  try {
    await testSampleRuleRepository.upsertTestSampleRule(testId, values);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw ApiError.badRequest("Selected container does not exist");
    }
    throw error;
  }

  return getTestSampleRule(testId);
}

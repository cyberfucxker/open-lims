import { ApiError } from "../utils/ApiError";
import * as testResultConfigRepository from "../repositories/testResultConfig.repository";
import { toTestResultConfigDto } from "../repositories/testResultConfig.repository";
import type {
  ListTestResultConfigsParams,
  ListTestResultConfigsResult,
  TestResultConfigDto,
  TestResultConfigWriteData,
} from "../types/master.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export async function listTestResultConfigs(
  params: ListTestResultConfigsParams,
): Promise<ListTestResultConfigsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await testResultConfigRepository.listTestResultConfigs({
    search: params.search,
    departmentId: params.departmentId,
    categoryId: params.categoryId,
    configured: params.configured,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toTestResultConfigDto), total };
}

export async function getTestResultConfig(testId: string): Promise<TestResultConfigDto> {
  const test = await testResultConfigRepository.findTestWithConfigById(testId);
  if (!test) {
    throw ApiError.notFound("Test not found");
  }
  return toTestResultConfigDto(test);
}

export async function upsertTestResultConfig(
  testId: string,
  values: TestResultConfigWriteData,
): Promise<TestResultConfigDto> {
  const test = await testResultConfigRepository.findTestWithConfigById(testId);
  if (!test) {
    throw ApiError.notFound("Test not found");
  }

  if (
    values.criticalLow !== undefined &&
    values.criticalLow !== null &&
    values.criticalHigh !== undefined &&
    values.criticalHigh !== null &&
    values.criticalLow > values.criticalHigh
  ) {
    throw ApiError.badRequest("Critical low cannot be greater than critical high");
  }

  await testResultConfigRepository.upsertTestResultConfig(testId, values);

  return getTestResultConfig(testId);
}

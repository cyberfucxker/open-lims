import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as homeFaqRepository from "../repositories/homeFaq.repository";
import { toHomeFaqDto, type HomeFaqWriteInput } from "../repositories/homeFaq.repository";
import type { HomeFaqDto, ListHomeFaqsParams, ListHomeFaqsResult } from "../types/homeFaq.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("FAQ not found");
    }
    throw error;
  }
}

export async function listHomeFaqs(params: ListHomeFaqsParams): Promise<ListHomeFaqsResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await homeFaqRepository.listHomeFaqs({
    isActive: params.isActive,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toHomeFaqDto), total };
}

/** Patient-app read path — every active FAQ, unpaginated. */
export async function listActiveHomeFaqs(): Promise<HomeFaqDto[]> {
  const rows = await homeFaqRepository.listActiveHomeFaqs();
  return rows.map(toHomeFaqDto);
}

export async function getHomeFaq(id: string): Promise<HomeFaqDto> {
  const faq = await homeFaqRepository.findHomeFaqById(id);
  if (!faq) {
    throw ApiError.notFound("FAQ not found");
  }
  return toHomeFaqDto(faq);
}

export async function createHomeFaq(values: HomeFaqWriteInput): Promise<HomeFaqDto> {
  const faq = await homeFaqRepository.createHomeFaq(values);
  return toHomeFaqDto(faq);
}

export async function updateHomeFaq(id: string, values: HomeFaqWriteInput): Promise<HomeFaqDto> {
  const faq = await withTranslatedErrors(() => homeFaqRepository.updateHomeFaq(id, values));
  return toHomeFaqDto(faq);
}

export async function setHomeFaqStatus(id: string, isActive: boolean): Promise<HomeFaqDto> {
  const faq = await withTranslatedErrors(() => homeFaqRepository.setHomeFaqStatus(id, isActive));
  return toHomeFaqDto(faq);
}

export async function deleteHomeFaq(id: string): Promise<void> {
  await withTranslatedErrors(() => homeFaqRepository.deleteHomeFaq(id));
}

export async function reorderHomeFaqs(ids: string[]): Promise<void> {
  await withTranslatedErrors(() => homeFaqRepository.reorderHomeFaqs(ids));
}

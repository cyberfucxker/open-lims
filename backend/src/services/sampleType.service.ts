import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as sampleTypeRepository from "../repositories/sampleType.repository";
import { toSampleTypeDto, type SampleTypeWriteInput } from "../repositories/sampleType.repository";
import type { ListMasterParams, ListSampleTypesResult, SampleTypeDto } from "../types/master.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Sample type not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict("A sample type with this name already exists");
      }
    }
    throw error;
  }
}

export async function listSampleTypes(params: ListMasterParams): Promise<ListSampleTypesResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await sampleTypeRepository.listSampleTypes({
    search: params.search,
    active: params.active,
    includeDeleted: params.includeDeleted === "true",
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toSampleTypeDto), total };
}

export async function getSampleType(id: string): Promise<SampleTypeDto> {
  const sampleType = await sampleTypeRepository.findSampleTypeById(id);
  if (!sampleType) {
    throw ApiError.notFound("Sample type not found");
  }
  return toSampleTypeDto(sampleType);
}

export async function createSampleType(values: SampleTypeWriteInput): Promise<SampleTypeDto> {
  const sampleType = await withTranslatedErrors(() =>
    sampleTypeRepository.createSampleType(values),
  );
  return toSampleTypeDto(sampleType);
}

export async function updateSampleType(
  id: string,
  values: SampleTypeWriteInput,
): Promise<SampleTypeDto> {
  const sampleType = await withTranslatedErrors(() =>
    sampleTypeRepository.updateSampleType(id, values),
  );
  return toSampleTypeDto(sampleType);
}

/** Soft delete, guarded: a sample type still referenced by a catalogue Test or a
 *  collected Sample is refused with a message naming the blocker. Without this
 *  the delete would succeed (it only sets `deletedAt`) and leave those tests
 *  pointing at a type the Test form can no longer offer — see
 *  `countSampleTypeUsage`. Turning `active` off is how an in-use type is retired
 *  from new tests while existing ones keep working. */
export async function deleteSampleType(id: string): Promise<void> {
  const existing = await sampleTypeRepository.findSampleTypeById(id);
  if (!existing) {
    throw ApiError.notFound("Sample type not found");
  }

  const { testCount, sampleCount } = await sampleTypeRepository.countSampleTypeUsage(id);
  const blockers = [
    testCount > 0 ? `${testCount} test${testCount === 1 ? "" : "s"}` : null,
    sampleCount > 0 ? `${sampleCount} collected sample${sampleCount === 1 ? "" : "s"}` : null,
  ].filter(Boolean);

  if (blockers.length > 0) {
    throw ApiError.conflict(
      `"${existing.name}" is used by ${blockers.join(" and ")} — reassign those first, or mark it inactive instead`,
    );
  }

  await withTranslatedErrors(() => sampleTypeRepository.softDeleteSampleType(id));
}

export async function restoreSampleType(id: string): Promise<SampleTypeDto> {
  const sampleType = await withTranslatedErrors(() => sampleTypeRepository.restoreSampleType(id));
  return toSampleTypeDto(sampleType);
}

export async function setSampleTypeStatus(id: string, active: boolean): Promise<SampleTypeDto> {
  const sampleType = await withTranslatedErrors(() =>
    sampleTypeRepository.setSampleTypeStatus(id, active),
  );
  return toSampleTypeDto(sampleType);
}

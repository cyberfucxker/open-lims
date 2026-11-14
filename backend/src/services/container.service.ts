import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as containerRepository from "../repositories/container.repository";
import { toContainerDto, type ContainerWriteInput } from "../repositories/container.repository";
import type { ContainerDto, ListContainersResult, ListMasterParams } from "../types/master.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("Container not found");
      }
      if (error.code === "P2002") {
        throw ApiError.conflict("A container with this name already exists");
      }
    }
    throw error;
  }
}

export async function listContainers(params: ListMasterParams): Promise<ListContainersResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await containerRepository.listContainers({
    search: params.search,
    active: params.active,
    includeDeleted: params.includeDeleted === "true",
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toContainerDto), total };
}

export async function getContainer(id: string): Promise<ContainerDto> {
  const container = await containerRepository.findContainerById(id);
  if (!container) {
    throw ApiError.notFound("Container not found");
  }
  return toContainerDto(container);
}

export async function createContainer(values: ContainerWriteInput): Promise<ContainerDto> {
  const container = await withTranslatedErrors(() => containerRepository.createContainer(values));
  return toContainerDto(container);
}

export async function updateContainer(
  id: string,
  values: ContainerWriteInput,
): Promise<ContainerDto> {
  const container = await withTranslatedErrors(() =>
    containerRepository.updateContainer(id, values),
  );
  return toContainerDto(container);
}

export async function deleteContainer(id: string): Promise<void> {
  await withTranslatedErrors(() => containerRepository.softDeleteContainer(id));
}

export async function restoreContainer(id: string): Promise<ContainerDto> {
  const container = await withTranslatedErrors(() => containerRepository.restoreContainer(id));
  return toContainerDto(container);
}

export async function setContainerStatus(id: string, active: boolean): Promise<ContainerDto> {
  const container = await withTranslatedErrors(() =>
    containerRepository.setContainerStatus(id, active),
  );
  return toContainerDto(container);
}

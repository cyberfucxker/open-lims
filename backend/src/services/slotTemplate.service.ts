import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import * as slotTemplateRepository from "../repositories/slotTemplate.repository";
import {
  toSlotTemplateDto,
  type SlotTemplateWriteInput,
} from "../repositories/slotTemplate.repository";
import type {
  ListSlotTemplatesParams,
  ListSlotTemplatesResult,
  SlotTemplateDto,
} from "../types/slotTemplate.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw ApiError.notFound("Slot template not found");
    }
    throw error;
  }
}

function assertTimeOrder(startTime: string, endTime: string): void {
  if (startTime >= endTime) {
    throw ApiError.badRequest("startTime must be before endTime");
  }
}

export async function listSlotTemplates(
  params: ListSlotTemplatesParams,
): Promise<ListSlotTemplatesResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await slotTemplateRepository.listSlotTemplates({
    search: params.search,
    active: params.active,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toSlotTemplateDto), total };
}

export async function listActiveSlotTemplates(): Promise<SlotTemplateDto[]> {
  const rows = await slotTemplateRepository.listActiveSlotTemplates();
  return rows.map(toSlotTemplateDto);
}

export async function getSlotTemplate(id: string): Promise<SlotTemplateDto> {
  const template = await slotTemplateRepository.findSlotTemplateById(id);
  if (!template) {
    throw ApiError.notFound("Slot template not found");
  }
  return toSlotTemplateDto(template);
}

export async function createSlotTemplate(values: SlotTemplateWriteInput): Promise<SlotTemplateDto> {
  assertTimeOrder(values.startTime, values.endTime);
  const template = await slotTemplateRepository.createSlotTemplate(values);
  return toSlotTemplateDto(template);
}

export async function updateSlotTemplate(
  id: string,
  values: SlotTemplateWriteInput,
): Promise<SlotTemplateDto> {
  assertTimeOrder(values.startTime, values.endTime);
  const template = await withTranslatedErrors(() =>
    slotTemplateRepository.updateSlotTemplate(id, values),
  );
  return toSlotTemplateDto(template);
}

export async function setSlotTemplateActive(id: string, active: boolean): Promise<SlotTemplateDto> {
  const template = await withTranslatedErrors(() =>
    slotTemplateRepository.setSlotTemplateActive(id, active),
  );
  return toSlotTemplateDto(template);
}

export async function deleteSlotTemplate(id: string): Promise<void> {
  const inUse = await slotTemplateRepository.isSlotTemplateInUse(id);
  if (inUse) {
    throw ApiError.conflict(
      "This slot template is assigned to a city or has upcoming bookings — deactivate it instead of deleting.",
    );
  }
  await withTranslatedErrors(() => slotTemplateRepository.deleteSlotTemplate(id));
}

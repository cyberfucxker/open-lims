import { ApiError } from "../utils/ApiError";
import { hashPassword } from "../utils/password.util";
import * as signatoryRepository from "../repositories/signatory.repository";
import { toSignatoryDto } from "../repositories/signatory.repository";
import type {
  ListSignatoriesParams,
  ListSignatoriesResult,
  SignatoryDto,
  SignatoryWriteData,
} from "../types/signatory.types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export async function listSignatories(
  params: ListSignatoriesParams,
): Promise<ListSignatoriesResult> {
  const page = params.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : DEFAULT_PAGE_SIZE;

  const { rows, total } = await signatoryRepository.listSignatories({
    search: params.search,
    active: params.active,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { rows: rows.map(toSignatoryDto), total };
}

export async function createSignatory(values: SignatoryWriteData): Promise<SignatoryDto> {
  const passkeyHash = values.passkey ? await hashPassword(values.passkey) : null;
  const created = await signatoryRepository.createSignatory({
    name: values.name,
    title: values.title ?? null,
    passkeyHash,
    active: values.active ?? true,
  });
  return toSignatoryDto(created);
}

export async function updateSignatory(
  id: string,
  values: SignatoryWriteData,
): Promise<SignatoryDto> {
  const existing = await signatoryRepository.findSignatoryById(id);
  if (!existing) {
    throw ApiError.notFound("Signatory not found");
  }

  const passkeyHash =
    values.passkey === undefined
      ? undefined
      : values.passkey
        ? await hashPassword(values.passkey)
        : null;

  const updated = await signatoryRepository.updateSignatory(id, {
    name: values.name,
    title: values.title ?? null,
    active: values.active,
    ...(passkeyHash !== undefined ? { passkeyHash } : {}),
  });
  return toSignatoryDto(updated);
}

export async function updateSignatoryImage(id: string, path: string): Promise<SignatoryDto> {
  const existing = await signatoryRepository.findSignatoryById(id);
  if (!existing) {
    throw ApiError.notFound("Signatory not found");
  }
  const updated = await signatoryRepository.updateSignatoryImage(id, path);
  return toSignatoryDto(updated);
}

export async function removeSignatory(id: string): Promise<void> {
  const existing = await signatoryRepository.findSignatoryById(id);
  if (!existing) {
    throw ApiError.notFound("Signatory not found");
  }
  await signatoryRepository.deleteSignatory(id);
}

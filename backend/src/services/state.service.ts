import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import type { StateDto, StateWriteData } from "../types/master.types";

/** The State master. Seeded with India's states, and now admin-editable from
 *  the Superadmin "Cities & Areas > States" tab — a city cannot be added for a
 *  state that is not on this list, so a missing one used to need a DB edit. */

async function withTranslatedErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw ApiError.notFound("State not found");
      }
    }
    throw error;
  }
}

/** Case-insensitive, because "Rajasthan" and "rajasthan" are the same state to
 *  everyone except a unique index — and there is no unique index on the name. */
async function assertNameIsFree(name: string, exceptId?: string): Promise<void> {
  const clash = await prisma.state.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { name: true },
  });
  if (clash) {
    throw ApiError.conflict(`${clash.name} is already on the list`);
  }
}

export async function listStates(): Promise<StateDto[]> {
  const states = await prisma.state.findMany({
    select: { id: true, name: true, code: true, _count: { select: { cities: true } } },
    orderBy: { name: "asc" },
  });
  return states.map(({ _count, ...state }) => ({ ...state, cityCount: _count.cities }));
}

export async function createState(values: StateWriteData): Promise<StateDto> {
  const name = values.name.trim();
  await assertNameIsFree(name);

  const state = await prisma.state.create({
    data: { name, code: values.code?.trim().toUpperCase() || null },
    select: { id: true, name: true, code: true },
  });
  return { ...state, cityCount: 0 };
}

export async function updateState(id: string, values: StateWriteData): Promise<StateDto> {
  const name = values.name.trim();
  await assertNameIsFree(name, id);

  const state = await withTranslatedErrors(() =>
    prisma.state.update({
      where: { id },
      data: { name, code: values.code?.trim().toUpperCase() || null },
      select: { id: true, name: true, code: true, _count: { select: { cities: true } } },
    }),
  );
  const { _count, ...rest } = state;
  return { ...rest, cityCount: _count.cities };
}

/** Only ever an empty state. A state with cities under it is the parent of live
 *  bookable addresses; removing it would orphan them, so the check is here and
 *  not left to a foreign key error the admin cannot read. */
export async function deleteState(id: string): Promise<void> {
  const state = await prisma.state.findUnique({
    where: { id },
    select: { name: true, _count: { select: { cities: true } } },
  });
  if (!state) {
    throw ApiError.notFound("State not found");
  }
  if (state._count.cities > 0) {
    throw ApiError.badRequest(
      `${state.name} has ${state._count.cities} city(ies) under it — move or remove those first`,
    );
  }
  await prisma.state.delete({ where: { id } });
}

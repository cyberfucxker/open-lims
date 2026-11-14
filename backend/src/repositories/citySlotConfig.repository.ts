import { prisma } from "../config/database";

export async function getCityWithConfig(cityId: string) {
  const [city, allTemplates, assignments] = await Promise.all([
    prisma.city.findUnique({
      where: { id: cityId },
      select: { id: true, name: true, useNewSlotSystem: true },
    }),
    prisma.slotTemplate.findMany({ where: { active: true }, orderBy: { startTime: "asc" } }),
    prisma.citySlotTemplate.findMany({ where: { cityId, isActive: true } }),
  ]);

  return { city, allTemplates, assignments };
}

/** Assign-and-replace: upserts a row for every requested template, and
 *  deactivates (never deletes — keeps historical AreaSlotBlock/SlotBlock
 *  rows resolvable) any existing assignment not in the new set. */
export async function replaceCityAssignments(cityId: string, slotTemplateIds: string[]) {
  await prisma.$transaction([
    prisma.citySlotTemplate.updateMany({
      where: { cityId, slotTemplateId: { notIn: slotTemplateIds } },
      data: { isActive: false },
    }),
    ...slotTemplateIds.map((slotTemplateId) =>
      prisma.citySlotTemplate.upsert({
        where: { cityId_slotTemplateId: { cityId, slotTemplateId } },
        update: { isActive: true },
        create: { cityId, slotTemplateId, isActive: true },
      }),
    ),
  ]);
}

export function setCityCutover(cityId: string, useNewSlotSystem: boolean) {
  return prisma.city.update({ where: { id: cityId }, data: { useNewSlotSystem } });
}

export function setCityPhlebotomyCharge(cityId: string, phlebotomyCharge: number) {
  return prisma.city.update({ where: { id: cityId }, data: { phlebotomyCharge } });
}

/** The one franchise whose price list drives this city's patient-app
 *  catalogue — see `City.parentOrganizationId`'s doc-comment. `null` clears
 *  it back to "no parent, full global catalogue." */
export function setCityParentOrganization(cityId: string, organizationId: string | null) {
  return prisma.city.update({
    where: { id: cityId },
    data: { parentOrganizationId: organizationId },
  });
}

export function findOrganizationForParentAssignment(organizationId: string) {
  return prisma.organization.findFirst({
    where: { id: organizationId, deletedAt: null },
    select: { id: true, name: true, cityId: true },
  });
}

export function listCitiesWithCutoverStatus() {
  return prisma.city.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      useNewSlotSystem: true,
      phlebotomyCharge: true,
      state: { select: { name: true } },
      // Counted here rather than derived client-side from a page of areas —
      // with ~1,800 areas across the network, any page the client holds is a
      // fraction of the total and the per-city numbers came out wrong.
      _count: { select: { areas: true } },
      areas: { where: { isActive: true }, select: { id: true } },
      parentOrganizationId: true,
      parentOrganization: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

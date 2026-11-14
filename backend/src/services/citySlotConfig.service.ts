import { ApiError } from "../utils/ApiError";
import * as citySlotConfigRepository from "../repositories/citySlotConfig.repository";
import type { AssignCitySlotTemplatesData, CitySlotConfigDto } from "../types/citySlotConfig.types";

export async function getCitySlotConfig(cityId: string): Promise<CitySlotConfigDto> {
  const { city, allTemplates, assignments } =
    await citySlotConfigRepository.getCityWithConfig(cityId);
  if (!city) {
    throw ApiError.notFound("City not found");
  }

  const assignedIds = new Set(assignments.map((a) => a.slotTemplateId));

  return {
    cityId: city.id,
    cityName: city.name,
    useNewSlotSystem: city.useNewSlotSystem,
    templates: allTemplates.map((t) => ({
      slotTemplateId: t.id,
      title: t.title,
      startTime: t.startTime,
      endTime: t.endTime,
      active: t.active,
      assigned: assignedIds.has(t.id),
    })),
  };
}

export async function assignCitySlotTemplates(
  data: AssignCitySlotTemplatesData,
): Promise<CitySlotConfigDto> {
  const { city } = await citySlotConfigRepository.getCityWithConfig(data.cityId);
  if (!city) {
    throw ApiError.notFound("City not found");
  }

  await citySlotConfigRepository.replaceCityAssignments(data.cityId, data.slotTemplateIds);
  return getCitySlotConfig(data.cityId);
}

export async function setCityCutover(
  cityId: string,
  useNewSlotSystem: boolean,
): Promise<CitySlotConfigDto> {
  const { city } = await citySlotConfigRepository.getCityWithConfig(cityId);
  if (!city) {
    throw ApiError.notFound("City not found");
  }

  if (useNewSlotSystem) {
    const config = await getCitySlotConfig(cityId);
    const hasAnyAssigned = config.templates.some((t) => t.assigned);
    if (!hasAnyAssigned) {
      throw ApiError.badRequest(
        "Assign at least one slot template to this city before switching it to the new system.",
      );
    }
  }

  await citySlotConfigRepository.setCityCutover(cityId, useNewSlotSystem);
  return getCitySlotConfig(cityId);
}

export async function listCitiesWithCutoverStatus() {
  const rows = await citySlotConfigRepository.listCitiesWithCutoverStatus();
  return rows.map((city) => ({
    id: city.id,
    name: city.name,
    stateName: city.state.name,
    useNewSlotSystem: city.useNewSlotSystem,
    phlebotomyCharge: Number(city.phlebotomyCharge),
    areaCount: city._count.areas,
    serviceableAreaCount: city.areas.length,
    parentOrganizationId: city.parentOrganizationId,
    parentOrganizationName: city.parentOrganization?.name ?? null,
  }));
}

export async function setCityPhlebotomyCharge(cityId: string, phlebotomyCharge: number) {
  const { city } = await citySlotConfigRepository.getCityWithConfig(cityId);
  if (!city) {
    throw ApiError.notFound("City not found");
  }

  await citySlotConfigRepository.setCityPhlebotomyCharge(cityId, phlebotomyCharge);
  return listCitiesWithCutoverStatus();
}

/**
 * Sets (or clears, with `organizationId: null`) the one franchise whose price
 * list drives this city's patient-app catalogue — see
 * `City.parentOrganizationId`'s doc-comment. The franchise must already be
 * assigned to this city (`Organization.cityId`); a franchise from another
 * city can't become this city's parent by surprise.
 */
export async function setCityParentOrganization(cityId: string, organizationId: string | null) {
  const { city } = await citySlotConfigRepository.getCityWithConfig(cityId);
  if (!city) {
    throw ApiError.notFound("City not found");
  }

  if (organizationId) {
    const organization =
      await citySlotConfigRepository.findOrganizationForParentAssignment(organizationId);
    if (!organization) {
      throw ApiError.notFound("Franchise not found");
    }
    if (organization.cityId !== cityId) {
      throw ApiError.badRequest(
        `${organization.name} is not assigned to this city — set its city first.`,
      );
    }
  }

  await citySlotConfigRepository.setCityParentOrganization(cityId, organizationId);
  return listCitiesWithCutoverStatus();
}

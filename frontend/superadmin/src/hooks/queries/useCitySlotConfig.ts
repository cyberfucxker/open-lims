import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  assignCitySlotTemplatesApi,
  fetchCitySlotConfig,
  fetchSlotSystemCities,
  setCityCutoverApi,
  setCityParentOrganizationApi,
  setCityPhlebotomyChargeApi,
} from "@/services/api/citySlotConfigApi";

export function useCities() {
  return useQuery({
    queryKey: ["city-slot-config", "cities"],
    queryFn: fetchSlotSystemCities,
  });
}

export function useCitySlotConfig(cityId: string | undefined) {
  return useQuery({
    queryKey: ["city-slot-config", "detail", cityId],
    queryFn: () => fetchCitySlotConfig(cityId as string),
    enabled: Boolean(cityId),
  });
}

function useInvalidateCitySlotConfig() {
  const queryClient = useQueryClient();
  return (cityId: string) => {
    queryClient.invalidateQueries({ queryKey: ["city-slot-config", "detail", cityId] });
    queryClient.invalidateQueries({ queryKey: ["city-slot-config", "cities"] });
  };
}

export function useAssignCitySlotTemplates() {
  const invalidate = useInvalidateCitySlotConfig();
  return useMutation({
    mutationFn: ({ cityId, slotTemplateIds }: { cityId: string; slotTemplateIds: string[] }) =>
      assignCitySlotTemplatesApi(cityId, slotTemplateIds),
    onSuccess: (_data, { cityId }) => invalidate(cityId),
  });
}

export function useSetCityCutover() {
  const invalidate = useInvalidateCitySlotConfig();
  return useMutation({
    mutationFn: ({ cityId, useNewSlotSystem }: { cityId: string; useNewSlotSystem: boolean }) =>
      setCityCutoverApi(cityId, useNewSlotSystem),
    onSuccess: (_data, { cityId }) => invalidate(cityId),
  });
}

export function useSetCityPhlebotomyCharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cityId, phlebotomyCharge }: { cityId: string; phlebotomyCharge: number }) =>
      setCityPhlebotomyChargeApi(cityId, phlebotomyCharge),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["city-slot-config", "cities"] }),
  });
}

export function useSetCityParentOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cityId, organizationId }: { cityId: string; organizationId: string | null }) =>
      setCityParentOrganizationApi(cityId, organizationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["city-slot-config", "cities"] }),
  });
}

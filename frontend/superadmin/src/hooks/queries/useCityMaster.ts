import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCityApi,
  createStateApi,
  deleteStateApi,
  fetchCities,
  fetchStates,
  updateStateApi,
  setCityStatusApi,
  updateCityApi,
  type CityFormValues,
  type ListCitiesParams,
  type StateFormValues,
} from "@/services/api/cityApi";

/** Named distinctly from `useCitySlotConfig.ts`'s own `useCities` (that one
 *  reads the enriched, active-only, Slot-Management view of cities) — this
 *  is the writable City master list itself. */
export function useCityList(params: ListCitiesParams = {}) {
  return useQuery({
    queryKey: ["cities", params],
    queryFn: () => fetchCities(params),
    placeholderData: (prev) => prev,
  });
}

export function useStates() {
  return useQuery({ queryKey: ["states"], queryFn: fetchStates, staleTime: 5 * 60 * 1000 });
}

/** A City add/edit/status-change changes what the patient app's location
 *  picker and every `/master/cities`-backed screen shows, plus (server-side)
 *  triggers a live sitemap rebuild — so both this module's own list AND the
 *  Slot Management screens' enriched `city-slot-config` view need to
 *  refetch. */
function useCityInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["cities"] });
    queryClient.invalidateQueries({ queryKey: ["city-slot-config"] });
  };
}

export function useCreateCity() {
  const invalidate = useCityInvalidation();
  return useMutation({
    mutationFn: (values: CityFormValues) => createCityApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdateCity() {
  const invalidate = useCityInvalidation();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CityFormValues }) =>
      updateCityApi(id, values),
    onSuccess: invalidate,
  });
}

export function useSetCityStatus() {
  const invalidate = useCityInvalidation();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setCityStatusApi(id, active),
    onSuccess: invalidate,
  });
}

/** Renaming a state changes the State column on every city under it, so the
 *  city list has to refetch too — not just the picker's own list. */
function useStateInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["states"] });
    queryClient.invalidateQueries({ queryKey: ["cities"] });
  };
}

export function useCreateState() {
  const invalidate = useStateInvalidation();
  return useMutation({
    mutationFn: (values: StateFormValues) => createStateApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdateState() {
  const invalidate = useStateInvalidation();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: StateFormValues }) =>
      updateStateApi(id, values),
    onSuccess: invalidate,
  });
}

export function useDeleteState() {
  const invalidate = useStateInvalidation();
  return useMutation({ mutationFn: (id: string) => deleteStateApi(id), onSuccess: invalidate });
}

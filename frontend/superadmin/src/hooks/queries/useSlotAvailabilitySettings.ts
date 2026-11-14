import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchSlotAvailabilitySettings,
  updateSlotAvailabilitySettingsApi,
  type SlotAvailabilitySettingsPatch,
} from "@/services/api/slotAvailabilitySettingsApi";

const QUERY_KEY = ["slot-availability-settings"];

export function useSlotAvailabilitySettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchSlotAvailabilitySettings,
  });
}

export function useUpdateSlotAvailabilitySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: SlotAvailabilitySettingsPatch) => updateSlotAvailabilitySettingsApi(patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

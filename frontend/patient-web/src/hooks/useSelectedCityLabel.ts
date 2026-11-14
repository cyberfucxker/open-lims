import { useAddresses } from "@/hooks/queries/useAddress";
import { useCityStore } from "@/store/cityStore";

/** Resolves what to show as "Your location" — the city explicitly picked via
 *  `SelectCityDialog` takes priority, falling back to the default saved
 *  address's free-text city if the patient hasn't picked one yet. Shared by
 *  the desktop `LocationPill` and the mobile `MobileLocationBar` so both stay
 *  in sync without duplicating the fallback logic. */
export function useSelectedCityLabel(): string | undefined {
  const { data: addresses } = useAddresses();
  const { city: pickedCity } = useCityStore();
  return pickedCity?.name ?? addresses?.find((a) => a.is_default)?.city ?? addresses?.[0]?.city;
}

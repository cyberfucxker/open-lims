import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { addressApi } from "@/services/api/addressApi";
import { useAuthStore } from "@/store/authStore";
import type { AddAddressRequest, EditAddressRequest } from "@/types";

export const ADDRESS_QUERY_KEY = ["addresses"];
export const AREAS_QUERY_KEY = ["areas"];

// Guests have no saved addresses to fetch — `LocationPill`/`MobileLocationBar`
// call this unconditionally from every page now that Home/Catalog are
// guest-browsable, so skip the doomed-to-401 request rather than firing it
// on every guest page view.
export function useAddresses() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ADDRESS_QUERY_KEY,
    queryFn: addressApi.list,
    enabled: isAuthenticated,
  });
}

export function useAreas() {
  return useQuery({ queryKey: AREAS_QUERY_KEY, queryFn: addressApi.areas });
}

export function useAddAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddAddressRequest) => addressApi.add(payload),
    onSuccess: () => {
      toast.success("Address added");
      queryClient.invalidateQueries({ queryKey: ADDRESS_QUERY_KEY });
    },
    onError: () => toast.error("Could not add address"),
  });
}

export function useEditAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EditAddressRequest) => addressApi.edit(payload),
    onSuccess: () => {
      toast.success("Address updated");
      queryClient.invalidateQueries({ queryKey: ADDRESS_QUERY_KEY });
    },
    onError: () => toast.error("Could not update address"),
  });
}

export function useRemoveAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => addressApi.remove(id),
    onSuccess: () => {
      toast.success("Address removed");
      queryClient.invalidateQueries({ queryKey: ADDRESS_QUERY_KEY });
    },
    onError: () => toast.error("Could not remove address"),
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => addressApi.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_QUERY_KEY });
    },
    onError: () => toast.error("Could not set default address"),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { familyApi } from "@/services/api/familyApi";
import { profileApi } from "@/services/api/profileApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { useAuthStore } from "@/store/authStore";
import type { AddFamilyMemberRequest } from "@/types";

export const PROFILE_QUERY_KEY = ["profile"];
export const FAMILY_QUERY_KEY = ["family"];

// Guests have no profile to fetch — `useCurrentUser` (navbar identity) calls
// this unconditionally from every page now that Home/Catalog are
// guest-browsable, so skip the doomed-to-401 request rather than firing it
// on every guest page view.
export function useProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: profileApi.getProfile,
    enabled: isAuthenticated,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<{ name: string; email: string }>) =>
      profileApi.updateProfile(patch),
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(error instanceof ApiRequestError ? error.message : "Could not update profile");
    },
  });
}

export function useFamilyMembers() {
  return useQuery({ queryKey: FAMILY_QUERY_KEY, queryFn: familyApi.list });
}

export function useAddFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddFamilyMemberRequest) => familyApi.add(payload),
    onSuccess: () => {
      toast.success("Family member added");
      queryClient.invalidateQueries({ queryKey: FAMILY_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(error instanceof ApiRequestError ? error.message : "Could not add family member");
    },
  });
}

export function useRemoveFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => familyApi.remove(memberId),
    onSuccess: () => {
      toast.success("Family member removed");
      queryClient.invalidateQueries({ queryKey: FAMILY_QUERY_KEY });
    },
    onError: () => toast.error("Could not remove family member"),
  });
}

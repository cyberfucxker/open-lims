import { create } from "zustand";
import { persist } from "zustand/middleware";

import { queryClient } from "@/providers/queryClient";

export interface AuthUser {
  id: string;
  mobile: string;
  name: string | null;
  isProfileComplete: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (token: string, user: AuthUser) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setSession: (token, user) => set({ token, user, isAuthenticated: true }),
      updateUser: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
        // Catalog/home responses embed personalised flags like
        // `is_added_to_cart` — left cached, the next guest view (or a
        // different account on the same device) could briefly show a
        // product as already in cart that THIS session never added.
        // `logout` is the one choke point every sign-out path (manual
        // button, and `httpClient`'s automatic logout on an expired token)
        // goes through, so clearing here covers all of them.
        queryClient.clear();
      },
    }),
    { name: "patient-web-auth" },
  ),
);

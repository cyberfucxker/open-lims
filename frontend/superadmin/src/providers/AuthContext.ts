import { createContext } from "react";

import type { AuthUser, LoginCredentials } from "@/types/auth";

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True until the initial silent-refresh + /me check on page load resolves. */
  isBootstrapping: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Patches the signed-in user in place — e.g. after a username change, so
   *  the header shows the new name without a reload. */
  updateUser: (patch: Partial<AuthUser>) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

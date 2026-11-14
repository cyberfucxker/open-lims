import { createContext } from "react";

import type { AuthUser, ForgotPasswordResponse, LoginCredentials } from "@/types/auth";

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True until the initial silent-refresh + /me check on page load resolves. */
  isBootstrapping: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  forgotPassword: (username: string) => Promise<ForgotPasswordResponse>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

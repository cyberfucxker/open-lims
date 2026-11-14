import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { refreshAccessToken } from "@/services/api/httpClient";
import { onSessionExpired, setAccessToken } from "@/services/api/tokenStore";
import * as authService from "@/services/authService";
import type { AuthUser, LoginCredentials } from "@/types/auth";
import {
  clearStoredRefreshToken,
  getStoredRefreshToken,
  persistRefreshToken,
} from "@/utils/authStorage";
import { AuthContext, type AuthContextValue } from "./AuthContext";

function AuthProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const hasBootstrapped = useRef(false);

  // On first load, silently trade a persisted refresh token for a fresh
  // access token + profile so a page reload doesn't force a re-login.
  useEffect(() => {
    if (hasBootstrapped.current) {
      // Refresh tokens are single-use: without this guard, React's
      // Strict Mode double-invoking effects in development would fire two
      // concurrent refresh calls for the same stored token.
      return;
    }
    hasBootstrapped.current = true;

    async function bootstrap() {
      if (!getStoredRefreshToken()) {
        setIsBootstrapping(false);
        return;
      }

      try {
        await refreshAccessToken();
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch {
        clearStoredRefreshToken();
        setAccessToken(null);
      } finally {
        setIsBootstrapping(false);
      }
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    onSessionExpired(() => {
      setUser(null);
      toast.error("Your session has expired. Please log in again.");
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setAccessToken(response.accessToken);
    persistRefreshToken(response.refreshToken, credentials.rememberMe);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getStoredRefreshToken();
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } finally {
      setAccessToken(null);
      clearStoredRefreshToken();
      setUser(null);
    }
  }, []);

  const forgotPassword = useCallback(
    (username: string) => authService.forgotPassword(username),
    [],
  );

  const resetPassword = useCallback(
    (token: string, newPassword: string) => authService.resetPassword(token, newPassword),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isBootstrapping,
      login,
      logout,
      forgotPassword,
      resetPassword,
    }),
    [user, isBootstrapping, login, logout, forgotPassword, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthProvider };

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}

/** Mirrors the backend's role names (roles are data, not a fixed enum). */
export type Role = "ADMIN" | "MANAGER" | "FRANCHISE" | (string & {});

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  fullName: string | null;
  role: Role;
  /** NULL for an ADMIN/staff login; set for a franchise portal login, and the
   *  flag that decides which route tree and navigation the app mounts. */
  organizationId: string | null;
  /** Superadmin modules a MANAGER may open (e.g. "orders", "phlebos"). Empty
   *  for ADMIN (unrestricted) and FRANCHISE. */
  staffModules: string[];
  lastLoginAt: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}

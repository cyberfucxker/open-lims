export interface AccessTokenPayload {
  sub: string;
  username: string;
  role: string;
  /** Set only for a B2B Organization's portal login. */
  organizationId?: string;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: string;
  organizationId?: string;
}

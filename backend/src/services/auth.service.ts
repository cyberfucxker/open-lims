import { LoginStatus, Prisma, type Organization, type Role, type User } from "@prisma/client";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { signAccessToken } from "../utils/jwt.util";
import { comparePassword, hashPassword } from "../utils/password.util";
import { generateSecureToken, hashToken } from "../utils/token.util";
import * as authRepository from "../repositories/auth.repository";
import { parseStaffModules } from "../middleware/staffModule.middleware";

export interface RequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
}

type UserWithRole = User & { role: Role; organization?: Organization | null };

const INVALID_CREDENTIALS_MESSAGE = "Invalid username or password";

/** The user shape every authenticated response returns — login, refresh and
 *  `/auth/me` all go through this so they can never drift apart.
 *
 *  `organizationId` is part of it because the client needs to know, before
 *  rendering anything, whether this session is an admin or a franchise portal
 *  user: it decides which route tree and which navigation the app mounts. It is
 *  already carried in the JWT for the server's own scoping (see
 *  `issueTokenPair`); this exposes the same fact to the client without making
 *  it decode the token. */
export function toAuthUserDto(user: UserWithRole) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role.name,
    /// NULL for an ADMIN/staff login; set for a franchise portal login.
    organizationId: user.organizationId,
    /// The superadmin modules a MANAGER may open — drives their sidebar and
    /// route guards. Empty for ADMIN (who sees everything) and FRANCHISE.
    staffModules: user.role.name === "MANAGER" ? parseStaffModules(user.staffModules) : [],
    lastLoginAt: user.lastLoginAt,
  };
}

function refreshTokenExpiryDate(): Date {
  const days = env.REFRESH_TOKEN_EXPIRES_IN_DAYS;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function issueTokenPair(
  user: Pick<UserWithRole, "id" | "username" | "role" | "organizationId">,
  context: RequestContext,
): Promise<AuthTokens> {
  const accessToken = signAccessToken({
    sub: user.id,
    username: user.username,
    role: user.role.name,
    organizationId: user.organizationId ?? undefined,
  });

  const refreshTokenPlain = generateSecureToken();
  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshTokenPlain),
    expiresAt: refreshTokenExpiryDate(),
    createdByIp: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    accessToken,
    refreshToken: refreshTokenPlain,
    accessTokenExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  };
}

export async function login(username: string, password: string, context: RequestContext) {
  const user = await authRepository.findUserByUsername(username);

  if (!user) {
    await authRepository.recordLoginHistory({
      username,
      status: LoginStatus.FAILED,
      reason: "USER_NOT_FOUND",
      ...context,
    });
    throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE);
  }

  if (!user.isActive) {
    await authRepository.recordLoginHistory({
      userId: user.id,
      username,
      status: LoginStatus.FAILED,
      reason: "ACCOUNT_INACTIVE",
      ...context,
    });
    throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE);
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    await authRepository.recordLoginHistory({
      userId: user.id,
      username,
      status: LoginStatus.FAILED,
      reason: "INVALID_PASSWORD",
      ...context,
    });
    throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE);
  }

  // A B2B Organization portal login is additionally gated on the linked
  // Organization being live — active, not soft-deleted, and with login
  // explicitly enabled. An ADMIN disabling/soft-deleting an Organization must
  // immediately lock out its portal user even though the User row itself stays
  // isActive.
  //
  // `deletedAt` is checked here as well as in `deleteOrganization` (which also
  // deactivates the login user) so the two are independent: re-activating the
  // user row by hand, or any future code path that does, cannot resurrect a
  // login into a deleted organization.
  const organizationIsLive =
    user.organization?.active && user.organization.loginEnabled && !user.organization.deletedAt;
  if (user.organizationId && !organizationIsLive) {
    await authRepository.recordLoginHistory({
      userId: user.id,
      username,
      status: LoginStatus.FAILED,
      reason: "ORGANIZATION_DISABLED",
      ...context,
    });
    throw ApiError.unauthorized(INVALID_CREDENTIALS_MESSAGE);
  }

  const tokens = await issueTokenPair(user, context);
  await authRepository.updateLastLogin(user.id);
  await authRepository.recordLoginHistory({
    userId: user.id,
    username,
    status: LoginStatus.SUCCESS,
    ...context,
  });

  return { ...tokens, user: toAuthUserDto(user) };
}

export async function refreshAccessToken(providedToken: string, context: RequestContext) {
  const tokenHash = hashToken(providedToken);
  const existing = await authRepository.findRefreshTokenByHash(tokenHash);

  if (!existing) {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  if (existing.revokedAt) {
    // Already revoked, either by logout or by a prior rotation. If it was
    // rotated out and is being presented again, that's a signal of possible
    // theft, so as a precaution every session the user currently holds is
    // burned rather than just rejecting this one request.
    await authRepository.revokeAllUserRefreshTokens(existing.userId);
    throw ApiError.unauthorized("Refresh token has been revoked");
  }

  if (existing.expiresAt.getTime() < Date.now()) {
    throw ApiError.unauthorized("Refresh token has expired");
  }

  if (!existing.user.isActive) {
    throw ApiError.unauthorized("Account is inactive");
  }

  // Claim the token before minting a replacement: two requests racing to
  // rotate the same token (e.g. duplicate calls from the client) must not
  // both succeed. Only the request that atomically flips revokedAt from
  // null wins; the loser is treated the same as token reuse.
  const newRefreshTokenPlain = generateSecureToken();
  const claim = await authRepository.claimRefreshTokenForRotation(
    existing.id,
    hashToken(newRefreshTokenPlain),
  );
  if (claim.count === 0) {
    await authRepository.revokeAllUserRefreshTokens(existing.userId);
    throw ApiError.unauthorized("Refresh token has been revoked");
  }

  const accessToken = signAccessToken({
    sub: existing.user.id,
    username: existing.user.username,
    role: existing.user.role.name,
    organizationId: existing.user.organizationId ?? undefined,
  });
  await authRepository.createRefreshToken({
    userId: existing.user.id,
    tokenHash: hashToken(newRefreshTokenPlain),
    expiresAt: refreshTokenExpiryDate(),
    createdByIp: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    accessToken,
    refreshToken: newRefreshTokenPlain,
    accessTokenExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  };
}

export async function logout(providedToken: string, requestingUserId: string): Promise<void> {
  const tokenHash = hashToken(providedToken);
  const existing = await authRepository.findRefreshTokenByHash(tokenHash);

  if (!existing || existing.revokedAt) {
    return; // Idempotent: already logged out.
  }

  if (existing.userId !== requestingUserId) {
    throw ApiError.forbidden("Refresh token does not belong to the authenticated user");
  }

  await authRepository.revokeRefreshTokenById(existing.id);
}

export interface ForgotPasswordResult {
  message: string;
  resetToken?: string;
}

export async function forgotPassword(username: string): Promise<ForgotPasswordResult> {
  const genericResult: ForgotPasswordResult = {
    message: "If that account exists, password reset instructions have been generated.",
  };

  const user = await authRepository.findUserByUsername(username);
  if (!user || !user.isActive) {
    return genericResult;
  }

  await authRepository.invalidateActivePasswordResetTokens(user.id);

  const resetTokenPlain = generateSecureToken();
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES * 60 * 1000);

  await authRepository.createPasswordResetToken({
    userId: user.id,
    tokenHash: hashToken(resetTokenPlain),
    expiresAt,
  });

  // No email/SMS transport exists yet in this codebase. Outside production,
  // hand the raw token back directly so the reset flow can be exercised
  // end-to-end; a future notifications module should deliver it instead.
  if (env.NODE_ENV !== "production") {
    return { ...genericResult, resetToken: resetTokenPlain };
  }

  return genericResult;
}

export async function resetPassword(providedToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(providedToken);
  const record = await authRepository.findValidPasswordResetTokenByHash(tokenHash);

  if (!record) {
    throw ApiError.badRequest("Invalid or expired reset token");
  }

  const passwordHash = await hashPassword(newPassword);
  await authRepository.updateUserPassword(record.userId, passwordHash);
  await authRepository.markPasswordResetTokenUsed(record.id);

  // Force re-authentication on every device after a password reset.
  await authRepository.revokeAllUserRefreshTokens(record.userId);
}

/** Self-service password change for an already-authenticated user — the
 *  franchise portal's "Change Password", and usable by staff logins too.
 *
 *  Distinct from `resetPassword` above, which is the forgot-password flow and
 *  proves identity with an emailed token instead of the current password.
 *
 *  Every existing session is revoked, then a fresh pair is minted and returned:
 *  a password change must invalidate sessions elsewhere (the whole point if the
 *  old password leaked), but logging the user out of the tab they just typed it
 *  in would be gratuitous. The caller swaps in the returned tokens. */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  context: RequestContext,
): Promise<AuthTokens> {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const currentMatches = await comparePassword(currentPassword, user.passwordHash);
  if (!currentMatches) {
    // Deliberately specific, unlike login's generic message: the caller has
    // already proven who they are with a valid access token, so there is no
    // account to enumerate and a vague error would just be unhelpful.
    throw ApiError.unauthorized("Current password is incorrect");
  }

  if (currentPassword === newPassword) {
    throw ApiError.badRequest("New password must be different from the current password");
  }

  const passwordHash = await hashPassword(newPassword);
  await authRepository.updateUserPassword(user.id, passwordHash);
  await authRepository.revokeAllUserRefreshTokens(user.id);

  return issueTokenPair(user, context);
}

/**
 * Renames the signed-in user's login. Re-checks the current password for the
 * same reason `changePassword` does — a stolen access token alone must not be
 * enough to take over the login. Other sessions are left alone (their refresh
 * tokens re-read the user, so they pick up the new name on next refresh);
 * this session gets a fresh pair because the access token embeds `username`.
 */
export async function changeUsername(
  userId: string,
  currentPassword: string,
  newUsername: string,
  context: RequestContext,
): Promise<AuthTokens & { username: string }> {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const currentMatches = await comparePassword(currentPassword, user.passwordHash);
  if (!currentMatches) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  const username = newUsername.trim();
  if (username === user.username) {
    throw ApiError.badRequest("New username must be different from the current username");
  }

  const taken = await authRepository.findUserByUsername(username);
  if (taken) {
    throw ApiError.conflict("This username is already taken");
  }

  let updated;
  try {
    updated = await authRepository.updateUsername(user.id, username);
  } catch (error) {
    // Lost a race with another rename/creation between the check and the write.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw ApiError.conflict("This username is already taken");
    }
    throw error;
  }

  const tokens = await issueTokenPair(updated, context);
  return { ...tokens, username: updated.username };
}

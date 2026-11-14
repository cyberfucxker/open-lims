import type { LoginStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/database";

export function findRoleByName(name: string) {
  return prisma.role.findUnique({ where: { name } });
}

export function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    include: { role: true, organization: true },
  });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });
}

export function updateLastLogin(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export function updateUsername(userId: string, username: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { username },
    include: { role: true },
  });
}

export function updateUserPassword(userId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export function createRefreshToken(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdByIp?: string | null;
  userAgent?: string | null;
}) {
  return prisma.refreshToken.create({ data });
}

export function findRefreshTokenByHash(tokenHash: string) {
  return prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { role: true } } },
  });
}

export function revokeRefreshTokenById(id: string, replacedByTokenHash?: string) {
  return prisma.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date(), replacedByTokenHash },
  });
}

/**
 * Revokes a token only if it is still active, in one atomic statement.
 * Two concurrent requests racing to rotate the same token will only ever
 * have one succeed (count === 1); the loser (count === 0) knows it lost the
 * race instead of both silently minting a valid new session.
 */
export function claimRefreshTokenForRotation(id: string, replacedByTokenHash: string) {
  return prisma.refreshToken.updateMany({
    where: { id, revokedAt: null },
    data: { revokedAt: new Date(), replacedByTokenHash },
  });
}

export function revokeAllUserRefreshTokens(userId: string) {
  return prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function createPasswordResetToken(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return prisma.passwordResetToken.create({ data });
}

export function invalidateActivePasswordResetTokens(userId: string) {
  return prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
}

export function findValidPasswordResetTokenByHash(tokenHash: string) {
  return prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    include: { user: { include: { role: true } } },
  });
}

export function markPasswordResetTokenUsed(id: string) {
  return prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}

export function recordLoginHistory(data: {
  userId?: string | null;
  username: string;
  status: LoginStatus;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Prisma.PrismaPromise<unknown> {
  return prisma.loginHistory.create({ data });
}

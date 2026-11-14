import { createHash, randomBytes } from "crypto";

/**
 * Refresh tokens and password reset tokens are opaque random strings, not
 * JWTs — they're handed to the client as-is and only their SHA-256 hash is
 * persisted. This lets a compromised database dump be revoked/rotated
 * without exposing usable session tokens, while still allowing an O(1)
 * indexed lookup (unlike bcrypt, which can't be looked up by hash).
 */
export function generateSecureToken(): string {
  return randomBytes(48).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

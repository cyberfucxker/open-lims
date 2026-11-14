import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { env } from "../config/env";
import { ApiError } from "./ApiError";

/**
 * AES-256-GCM for secrets stored at rest (WhatsApp/AI keys entered in
 * Superadmin). Ciphertext format: `v1:<iv b64>:<tag b64>:<data b64>`.
 *
 * The key is `WHATSAPP_ENCRYPTION_KEY` — rotating it makes every stored value
 * undecryptable (they have to be re-entered), which is why decrypt failures
 * surface as a clear "re-enter the key" error rather than a crash.
 */

function loadKey(): Buffer {
  const raw = env.WHATSAPP_ENCRYPTION_KEY;
  if (!raw) {
    throw ApiError.internal("WHATSAPP_ENCRYPTION_KEY is not configured on the server");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw ApiError.internal("WHATSAPP_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", loadKey(), iv);
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), data.toString("base64")].join(":");
}

export function decryptSecret(ciphertext: string): string {
  const [version, iv, tag, data] = ciphertext.split(":");
  if (version !== "v1" || !iv || !tag || !data) {
    throw ApiError.internal("Stored secret has an unknown format — re-enter it in Superadmin");
  }
  try {
    const decipher = createDecipheriv("aes-256-gcm", loadKey(), Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString(
      "utf8",
    );
  } catch {
    throw ApiError.internal(
      "Stored secret could not be decrypted (WHATSAPP_ENCRYPTION_KEY changed?) — re-enter it in Superadmin",
    );
  }
}

export function decryptOptional(ciphertext: string | null | undefined): string | null {
  return ciphertext ? decryptSecret(ciphertext) : null;
}

/** HMAC-SHA256 keyed off the same server key, with a purpose label so a
 *  signature made for one use can never verify for another. */
export function signPayload(purpose: string, payload: string): string {
  return createHmac("sha256", loadKey()).update(`${purpose}:${payload}`).digest("base64url");
}

export function verifySignature(purpose: string, payload: string, signature: string): boolean {
  const expected = Buffer.from(signPayload(purpose, payload));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Last four characters only — what the settings screen shows for a saved key. */
export function maskSecret(plaintext: string | null): string | null {
  if (!plaintext) return null;
  return plaintext.length <= 4 ? "••••" : `••••${plaintext.slice(-4)}`;
}

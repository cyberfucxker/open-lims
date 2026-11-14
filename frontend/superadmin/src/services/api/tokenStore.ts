/**
 * The access token lives in memory only — never in localStorage/sessionStorage
 * — so it disappears on tab close/reload and can't be lifted by a storage-read
 * XSS payload. A fresh one is re-derived from the refresh token on every load.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

type SessionExpiredHandler = () => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

/** Registered by AuthProvider so the axios layer (outside React) can trigger a logout + redirect. */
export function onSessionExpired(handler: SessionExpiredHandler): void {
  sessionExpiredHandler = handler;
}

export function notifySessionExpired(): void {
  sessionExpiredHandler?.();
}

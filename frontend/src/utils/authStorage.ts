const REFRESH_TOKEN_KEY = "lims.refreshToken";

/**
 * "Remember me" controls persistence tier, not whether a refresh token
 * exists at all: checked -> localStorage (survives browser restarts),
 * unchecked -> sessionStorage (cleared when the tab/browser closes). The
 * access token itself is never persisted here — it only ever lives in
 * memory (see tokenStore.ts) and is re-derived from the refresh token on
 * every fresh page load.
 */
export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function persistRefreshToken(token: string, rememberMe: boolean): void {
  clearStoredRefreshToken();
  (rememberMe ? localStorage : sessionStorage).setItem(REFRESH_TOKEN_KEY, token);
}

/** Writes a rotated token back to whichever tier currently holds one. */
export function updateStoredRefreshToken(token: string): void {
  if (localStorage.getItem(REFRESH_TOKEN_KEY) !== null) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    return;
  }
  sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearStoredRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Single source of truth for the mobile-app store links, the
 *  self-hosted `/get-app` hop the QR code encodes, and the QR image URL
 *  builder. Imported by the footer, the floating download widget and the
 *  `/get-app` redirect page so the three can never drift apart. */

// Set VITE_APP_STORE_URL / VITE_PLAY_STORE_URL to your own store listings.
const APP_STORE_URL: string =
  import.meta.env.VITE_APP_STORE_URL || "https://apps.apple.com/app/example/id0000000000";
const PLAY_STORE_URL: string =
  import.meta.env.VITE_PLAY_STORE_URL || "https://play.google.com/store/apps/details?id=com.example.app";

/** The path the QR code points at — deliberately our own domain rather than a
 *  store URL, so one printed/rendered QR serves both platforms: `/get-app`
 *  sniffs the scanning phone's User-Agent and forwards it to the right store.
 *  Encoding a store link directly would mean two different QR codes. */
const GET_APP_PATH = "/get-app";

type MobilePlatform = "ios" | "android" | "other";

/** iPadOS 13+ lies in its User-Agent and reports itself as "Macintosh", so a
 *  plain `/ipad/` test misses every modern iPad. The touch-point check is the
 *  standard tell-apart: real Macs report 0, iPads report 5. */
function detectPlatform(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : "",
  maxTouchPoints: number = typeof navigator !== "undefined" ? navigator.maxTouchPoints : 0,
): MobilePlatform {
  const ua = userAgent.toLowerCase();
  // Checked before iOS: Android tablets/phones never match the iOS patterns,
  // but keeping the order explicit documents the precedence.
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/macintosh/.test(ua) && maxTouchPoints > 1) return "ios";
  return "other";
}

/** Desktop and anything unrecognised fall through to the Play Store — it's the
 *  larger install base here and its web listing degrades gracefully on a
 *  desktop browser, whereas an App Store link opens an "open in iTunes" dance. */
function resolveStoreUrl(platform: MobilePlatform = detectPlatform()): string {
  return platform === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
}

/** Absolute `/get-app` URL for the current origin — a QR code has to carry an
 *  absolute URL, a path alone is unscannable. Falls back to the production
 *  host when there's no `window` (prerender/SSR pass). */
function getAppUrl(): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://www.example.com";
  return `${origin}${GET_APP_PATH}`;
}

/** QR images come from api.qrserver.com (free, no key, no bundle cost) instead
 *  of pulling in a QR-generation package for a single static code. */
function buildQrImageUrl(data: string, size = 300): string {
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    margin: "0",
    ecc: "M",
    data,
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

export {
  APP_STORE_URL,
  PLAY_STORE_URL,
  GET_APP_PATH,
  detectPlatform,
  resolveStoreUrl,
  getAppUrl,
  buildQrImageUrl,
};
export type { MobilePlatform };

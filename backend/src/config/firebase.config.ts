import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { env } from "./env";

declare global {
  var __firebaseApp: App | undefined;
}

/**
 * Lazily creates (and reuses) the single Firebase Admin app instance for this
 * process — mirrors `database.ts`'s `global.__prisma` guard so `tsx watch`'s
 * hot reload in dev can't trigger "The default Firebase app already exists"
 * by re-running `initializeApp()` on every file save. Also checks
 * `getApps()` directly as a second guard, in case some other module ever
 * initializes the default app first.
 *
 * Returns `null` (never throws) when credentials aren't configured yet —
 * `notification.service.ts` turns that into a normal
 * `{ success: false, error: "..." }` result instead of crashing whatever
 * request happened to trigger a notification.
 */
export function getFirebaseApp(): App | null {
  if (global.__firebaseApp) return global.__firebaseApp;
  const existing = getApps();
  if (existing.length > 0) {
    global.__firebaseApp = existing[0];
    return global.__firebaseApp;
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    return null;
  }

  global.__firebaseApp = initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // A private key can't survive as a real multi-line value in a `.env`
      // file, so it's stored with literal `\n` escape sequences and turned
      // back into real newlines here — the PEM parser rejects the key
      // without this.
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  return global.__firebaseApp;
}

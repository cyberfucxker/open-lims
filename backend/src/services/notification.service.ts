import { getMessaging } from "firebase-admin/messaging";
import { getFirebaseApp } from "../config/firebase.config";

export interface SendCustomNotificationInput {
  /** Single recipient device's FCM registration token. */
  token: string;
  title: string;
  body: string;
  /** Custom key/value payload delivered alongside the notification (e.g.
   *  `{ orderId, type }` so the app can deep-link on tap). FCM's wire format
   *  only accepts string values — anything not already a string is
   *  JSON-stringified automatically, so callers can pass plain
   *  numbers/booleans/objects without hitting a cryptic SDK error. */
  data?: Record<string, unknown>;
  /** Android-specific delivery overrides — set only for a push that needs
   *  to stand out while the app is backgrounded/killed (e.g. a new job
   *  assignment that should ring/vibrate like an incoming call). `channelId`
   *  must name a notification channel the app itself has already created
   *  with its own sound/vibration — FCM can route a push to that channel,
   *  but can't define one. Omit entirely for a routine push; Android then
   *  falls back to the app's default channel/sound. */
  android?: {
    priority?: "high" | "normal";
    channelId?: string;
  };
}

export interface SendCustomNotificationResult {
  success: boolean;
  /** FCM's message id, present only on success. */
  messageId?: string;
  /** Human-readable failure reason, present only on failure — covers
   *  missing Firebase credentials, an invalid/unregistered token, and any
   *  other Firebase-side error. */
  error?: string;
}

/**
 * Sends a single push notification to one device via Firebase Cloud
 * Messaging.
 *
 * Deliberately standalone: nothing in the codebase calls this yet. Wire it up
 * from wherever a real trigger eventually needs to send a notification —
 * e.g. once a report is ready, once an order status changes, etc. — using
 * whatever `fcmToken` is stored on the recipient's `AppUser`/`Phlebotomist`
 * row (captured at OTP-verify time).
 *
 * Never throws. Every failure — missing/unconfigured Firebase credentials, a
 * bad token, or any other Firebase-side error — comes back as
 * `{ success: false, error }` so a failed notification can never take down
 * whatever flow eventually calls this.
 *
 * @example
 * const result = await sendCustomNotification({
 *   token: appUser.fcmToken,
 *   title: "Report ready",
 *   body: "Your CBC report is ready to view.",
 *   data: { orderId: order.id, type: "REPORT_READY" },
 * });
 * if (!result.success) {
 *   logger.warn(`Push notification failed: ${result.error}`);
 * }
 */
export async function sendCustomNotification(
  input: SendCustomNotificationInput,
): Promise<SendCustomNotificationResult> {
  const { token, title, body, data, android } = input;

  if (!token?.trim()) {
    return { success: false, error: "A device FCM token is required." };
  }
  if (!title?.trim()) {
    return { success: false, error: "A notification title is required." };
  }
  if (!body?.trim()) {
    return { success: false, error: "A notification body is required." };
  }

  const app = getFirebaseApp();
  if (!app) {
    return {
      success: false,
      error:
        "Firebase is not configured — set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.",
    };
  }

  try {
    const messageId = await getMessaging(app).send({
      token,
      notification: { title, body },
      data: data ? stringifyData(data) : undefined,
      android: android
        ? {
            priority: android.priority,
            notification: android.channelId ? { channelId: android.channelId } : undefined,
          }
        : undefined,
    });
    return { success: true, messageId };
  } catch (error) {
    return { success: false, error: describeFirebaseError(error) };
  }
}

function stringifyData(data: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === "string" ? value : JSON.stringify(value),
    ]),
  );
}

/** Firebase's SDK errors carry a stable `.code` (e.g.
 *  `"messaging/registration-token-not-registered"`,
 *  `"messaging/invalid-registration-token"`) — surfaced here since it's
 *  usually the single most useful piece of information for whoever ends up
 *  debugging a failed send, rather than an opaque stack trace. */
function describeFirebaseError(error: unknown): string {
  if (error && typeof error === "object") {
    const code = "code" in error ? String((error as { code?: unknown }).code) : undefined;
    const message =
      "message" in error ? String((error as { message?: unknown }).message) : undefined;
    if (code && message) return `${code}: ${message}`;
    if (message) return message;
  }
  return "Failed to send notification.";
}

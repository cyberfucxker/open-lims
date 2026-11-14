import type { AppNotificationType, PhleboNotificationType } from "@prisma/client";
import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { sendCustomNotification } from "./notification.service";
import { notifyWhatsappLifecycle } from "./whatsapp/templates.service";

// Loaded lazily: followUp.service imports this module (for its push), so a
// static import here would be circular.
const followUps = () => import("./whatsapp/followUp.service");
const logFollowUpError = (error: unknown) =>
  logger.warn("Follow-up reminder hook failed", { error: String(error) });

/**
 * Push + in-app notifications for `AppOrder`/booking lifecycle events —
 * confirm, phlebo assignment (and its own journey steps), sample collected,
 * sample dropped at lab, report ready, and status changes/cancellation.
 *
 * Every patient-facing function here does two things, in this order:
 *   1. Always writes a row to the in-app `Notification` list — that's
 *      history, not delivery, so it happens whether or not a push token
 *      exists, whether or not push is enabled, and whether or not the
 *      actual FCM send succeeds.
 *   2. Sends the push itself, but only if the patient has a device token
 *      *and* hasn't turned notifications off (`AppUser.pushEnabled`) — the
 *      one real off-switch per PUSH_NOTIFICATION_API_SPEC.md §4b.
 *
 * Call every one of these AFTER whatever DB write/transaction triggered it
 * has already committed — a Firebase call (or this module's own DB insert)
 * has no business holding another transaction's locks open — and none of
 * them throw, so a failed notification can never fail the request that
 * triggered it. Same precedent as the welcome notification in
 * `app/auth.service.ts#completeProfile`.
 *
 * The `*ToPhlebo` functions target a `Phlebotomist` instead of an `AppUser`,
 * and follow the same two-step rule against their own tables: a
 * `PhleboNotification` row (history, always) plus a push (best-effort, only
 * with a device token). The one asymmetry is the off-switch — a phlebo has
 * no `pushEnabled` preference, because these are work assignments rather
 * than marketing, and a collection boy who has silenced "you have a new
 * booking" is not a state the business wants to support.
 */

/** DB enum is UPPER_SNAKE; the Flutter client's push `data.type` and the
 *  in-app list's `type` field are both lower_snake per
 *  PUSH_NOTIFICATION_API_SPEC.md — same mapping `notificationList.service.ts`
 *  uses for the list endpoint, kept local here to avoid a `services/` ->
 *  `services/app/` dependency for six constant strings. */
const TYPE_TO_API: Record<AppNotificationType, string> = {
  ORDER_UPDATE: "order_update",
  REPORT_READY: "report_ready",
  PROMO: "promo",
  PRESCRIPTION_STATUS: "prescription_status",
  APPOINTMENT_REMINDER: "appointment_reminder",
  BOOKING_CANCELLED: "booking_cancelled",
};

interface NotifyAppUserInput {
  appUserId: string;
  type: AppNotificationType;
  title: string;
  body: string;
  /** The `AppOrder.id` this notification is about — becomes both the
   *  in-app row's `target_id` and the push's `data.target_id`, for the
   *  client to deep-link on tap. */
  orderId: string;
}

async function notifyAppUser({
  appUserId,
  type,
  title,
  body,
  orderId,
}: NotifyAppUserInput): Promise<void> {
  await prisma.notification.create({
    data: { appUserId, type, title, message: body, targetId: orderId },
  });

  const appUser = await prisma.appUser.findUnique({
    where: { id: appUserId },
    select: { fcmToken: true, pushEnabled: true },
  });
  if (!appUser?.pushEnabled || !appUser.fcmToken) return;

  const result = await sendCustomNotification({
    token: appUser.fcmToken,
    title,
    body,
    data: { type: TYPE_TO_API[type], target_id: orderId },
  });
  if (!result.success) {
    logger.warn("Order notification failed to send", {
      appUserId,
      orderId,
      type,
      title,
      error: result.error,
    });
  }
}

async function pushToPhlebo(
  fcmToken: string | null | undefined,
  title: string,
  body: string,
  data: Record<string, string | undefined>,
  logContext: Record<string, unknown>,
  android?: Parameters<typeof sendCustomNotification>[0]["android"],
): Promise<void> {
  if (!fcmToken) return; // no device on file — not an error
  const result = await sendCustomNotification({ token: fcmToken, title, body, data, android });
  if (!result.success) {
    logger.warn("Phlebo notification failed to send", {
      ...logContext,
      title,
      error: result.error,
    });
  }
}

/** Slug form of the phlebo notification type, for the push payload's
 *  `data.type` — matches what `services/phlebo/notification.service.ts`
 *  returns on the in-app list, so a push and a list row describing the same
 *  event read identically to the app. */
const PHLEBO_TYPE_TO_API: Record<PhleboNotificationType, string> = {
  NEW_ASSIGNMENT: "new_assignment",
  BOOKING_CANCELLED: "booking_cancelled",
  BOOKING_UNASSIGNED: "booking_unassigned",
  BOOKING_RESCHEDULED: "booking_rescheduled",
};

/** `NEW_ASSIGNMENT` is the one phlebo push that has to cut through a
 *  backgrounded/killed app — a new job waiting on the phlebo's response —
 *  so it's routed to a notification channel the phlebo app has pre-configured
 *  with its own ringtone/vibration (app team's channel id, confirmed against
 *  their build). Every other phlebo notification type deliberately omits
 *  `android` entirely and falls back to the app's default, quieter channel. */
const NEW_ASSIGNMENT_ANDROID_CONFIG = {
  priority: "high" as const,
  channelId: "new_assignment_channel",
};

interface NotifyPhleboInput {
  phleboId: string;
  fcmToken: string | null | undefined;
  type: PhleboNotificationType;
  title: string;
  body: string;
  /** The `AppOrder.id` this is about — the in-app row's `target_id` and the
   *  push's `data.target_id`, for deep-linking to the booking on tap. */
  orderId: string;
  orderNumber: string;
}

/** `notifyAppUser`'s twin for the phlebo side: in-app row first (history,
 *  unconditional), push second (best-effort). Never throws — see this
 *  module's doc-comment. */
async function notifyPhlebo({
  phleboId,
  fcmToken,
  type,
  title,
  body,
  orderId,
  orderNumber,
}: NotifyPhleboInput): Promise<void> {
  await prisma.phleboNotification.create({
    data: { phleboId, type, title, message: body, targetId: orderId },
  });

  await pushToPhlebo(
    fcmToken,
    title,
    body,
    { type: PHLEBO_TYPE_TO_API[type], target_id: orderId, orderNumber },
    { phleboId, orderId, orderNumber, type },
    type === "NEW_ASSIGNMENT" ? NEW_ASSIGNMENT_ANDROID_CONFIG : undefined,
  );
}

export async function notifyOrderConfirmed(
  appUserId: string,
  orderId: string,
  orderNumber: string,
): Promise<void> {
  void notifyWhatsappLifecycle("booking_confirmed", orderId);
  void followUps()
    .then((m) => m.markFollowUpsRebooked(orderId))
    .catch(logFollowUpError);
  await notifyAppUser({
    appUserId,
    orderId,
    type: "ORDER_UPDATE",
    title: "Booking confirmed",
    body: `Your booking ${orderNumber} is confirmed. We'll notify you once a phlebotomist is assigned.`,
  });
}

export async function notifyPhleboAssignedToPatient(
  appUserId: string,
  orderId: string,
  orderNumber: string,
  phleboName: string | null,
): Promise<void> {
  await notifyAppUser({
    appUserId,
    orderId,
    type: "ORDER_UPDATE",
    title: "Phlebotomist assigned",
    body: phleboName
      ? `${phleboName} has been assigned to collect your sample for booking ${orderNumber}.`
      : `A phlebotomist has been assigned for booking ${orderNumber}.`,
  });
}

export async function notifyNewAssignmentToPhlebo(
  phlebo: { id: string; fcmToken: string | null },
  orderId: string,
  orderNumber: string,
): Promise<void> {
  await notifyPhlebo({
    phleboId: phlebo.id,
    fcmToken: phlebo.fcmToken,
    orderId,
    orderNumber,
    type: "NEW_ASSIGNMENT",
    title: "New booking assigned",
    body: `You've been assigned a new sample collection — booking ${orderNumber}.`,
  });
}

/** An assigned booking got cancelled (by the patient or an admin) — the
 *  phlebo may already be travelling, so this is the one notification here
 *  that saves a wasted trip. Only call it when the order actually had a
 *  phlebo on it. */
export async function notifyBookingCancelledToPhlebo(
  phlebo: { id: string; fcmToken: string | null },
  orderId: string,
  orderNumber: string,
): Promise<void> {
  await notifyPhlebo({
    phleboId: phlebo.id,
    fcmToken: phlebo.fcmToken,
    orderId,
    orderNumber,
    type: "BOOKING_CANCELLED",
    title: "Booking cancelled",
    body: `Booking ${orderNumber} has been cancelled — no collection needed.`,
  });
}

/** The patient moved this booking to another date/slot. The phlebo stays
 *  assigned (see `order.service.ts#rescheduleOrder` for why), so without this
 *  the job would silently disappear from today's list and reappear on some
 *  other day. `when` is already formatted for display — "12 Sep, 08:00 -
 *  10:00" — because the phlebo app renders the message verbatim. */
export async function notifyBookingRescheduledToPhlebo(
  phlebo: { id: string; fcmToken: string | null },
  orderId: string,
  orderNumber: string,
  when: string,
): Promise<void> {
  await notifyPhlebo({
    phleboId: phlebo.id,
    fcmToken: phlebo.fcmToken,
    orderId,
    orderNumber,
    type: "BOOKING_RESCHEDULED",
    title: "Booking rescheduled",
    body: `Booking ${orderNumber} has moved to ${when}.`,
  });
}

/** The booking was taken off this phlebo's list: an admin re-assigned it to
 *  someone else or cleared the assignment. Deliberately does NOT say who it
 *  went to — that's roster information the app has no screen for. */
export async function notifyBookingUnassignedFromPhlebo(
  phlebo: { id: string; fcmToken: string | null },
  orderId: string,
  orderNumber: string,
): Promise<void> {
  await notifyPhlebo({
    phleboId: phlebo.id,
    fcmToken: phlebo.fcmToken,
    orderId,
    orderNumber,
    type: "BOOKING_UNASSIGNED",
    title: "Booking removed",
    body: `Booking ${orderNumber} is no longer assigned to you.`,
  });
}

export async function notifyPhleboAccepted(
  appUserId: string,
  orderId: string,
  orderNumber: string,
): Promise<void> {
  await notifyAppUser({
    appUserId,
    orderId,
    type: "ORDER_UPDATE",
    title: "Phlebotomist confirmed",
    body: `Your phlebotomist has confirmed the visit for booking ${orderNumber}.`,
  });
}

export async function notifyPhleboOnTheWay(
  appUserId: string,
  orderId: string,
  orderNumber: string,
): Promise<void> {
  await notifyAppUser({
    appUserId,
    orderId,
    type: "ORDER_UPDATE",
    title: "Phlebotomist on the way",
    body: `Your phlebotomist is on the way for booking ${orderNumber}.`,
  });
}

export async function notifyPhleboReached(
  appUserId: string,
  orderId: string,
  orderNumber: string,
): Promise<void> {
  await notifyAppUser({
    appUserId,
    orderId,
    type: "ORDER_UPDATE",
    title: "Phlebotomist has arrived",
    body: `Your phlebotomist has reached your location for booking ${orderNumber}.`,
  });
}

/** The phlebo declined an already-assigned job — `phleboId` gets cleared in
 *  the same write (see `booking.service.ts`), so this tells the patient
 *  their booking is still on track without naming the decline. */
export async function notifyPhleboReassigning(
  appUserId: string,
  orderId: string,
  orderNumber: string,
): Promise<void> {
  await notifyAppUser({
    appUserId,
    orderId,
    type: "ORDER_UPDATE",
    title: "Booking update",
    body: `We're assigning a new phlebotomist for booking ${orderNumber}.`,
  });
}

export async function notifySampleCollected(
  appUserId: string,
  orderId: string,
  orderNumber: string,
): Promise<void> {
  void notifyWhatsappLifecycle("sample_collected", orderId);
  await notifyAppUser({
    appUserId,
    orderId,
    type: "ORDER_UPDATE",
    title: "Sample collected",
    body: `Your sample for booking ${orderNumber} has been collected and is on its way to the lab.`,
  });
}

export async function notifySampleDropped(
  appUserId: string,
  orderId: string,
  orderNumber: string,
): Promise<void> {
  await notifyAppUser({
    appUserId,
    orderId,
    type: "ORDER_UPDATE",
    title: "Sample reached the lab",
    body: `Your sample for booking ${orderNumber} has reached the lab and is being processed.`,
  });
}

export async function notifyReportReady(
  appUserId: string,
  orderId: string,
  orderNumber: string | undefined,
): Promise<void> {
  void notifyWhatsappLifecycle("report_ready", orderId);
  void followUps()
    .then((m) => m.scheduleFollowUpsForOrder(orderId))
    .catch(logFollowUpError);
  await notifyAppUser({
    appUserId,
    orderId,
    type: "REPORT_READY",
    title: "Report ready",
    body: orderNumber
      ? `Your report for booking ${orderNumber} is ready to view.`
      : "Your report is ready to view.",
  });
}

/** "Time to repeat your test" — see `whatsapp/followUp.service.ts`. Uses
 *  the existing APPOINTMENT_REMINDER type so the app needs no new enum value;
 *  `orderId` is the original order the reminder came from. */
export async function notifyTestFollowUp(
  appUserId: string,
  orderId: string,
  title: string,
  body: string,
): Promise<void> {
  await notifyAppUser({ appUserId, orderId, type: "APPOINTMENT_REMINDER", title, body });
}

/** Patient-side confirmation that their own reschedule went through — the
 *  in-app row doubles as a record of when the booking moved, which the
 *  `AppOrder` itself doesn't keep. `ORDER_UPDATE` rather than a new type:
 *  it's the same "something about your booking changed" bucket the app
 *  already renders, and adding an enum value would break the Flutter
 *  client's exhaustive `type` switch. */
export async function notifyOrderRescheduled(
  appUserId: string,
  orderId: string,
  orderNumber: string,
  when: string,
): Promise<void> {
  await notifyAppUser({
    appUserId,
    orderId,
    type: "ORDER_UPDATE",
    title: "Booking rescheduled",
    body: `Booking ${orderNumber} is now scheduled for ${when}.`,
  });
}

export async function notifyOrderCancelled(
  appUserId: string,
  orderId: string,
  orderNumber: string,
  reason?: string | null,
): Promise<void> {
  await notifyAppUser({
    appUserId,
    orderId,
    type: "BOOKING_CANCELLED",
    title: "Booking cancelled",
    body: reason
      ? `Your booking ${orderNumber} has been cancelled. Reason: ${reason}`
      : `Your booking ${orderNumber} has been cancelled.`,
  });
}

/** "SAMPLE_DROPPED" -&gt; "Sample dropped" — for the generic status-change
 *  notification, which (unlike the dedicated ones above) has to describe
 *  whatever status an admin picked rather than a known fixed message. */
export function humanizeOrderStatus(status: string): string {
  return status
    .split("_")
    .map((word, i) =>
      i === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase(),
    )
    .join(" ");
}

export async function notifyOrderStatusChanged(
  appUserId: string,
  orderId: string,
  orderNumber: string,
  status: string,
): Promise<void> {
  await notifyAppUser({
    appUserId,
    orderId,
    type: "ORDER_UPDATE",
    title: "Booking update",
    body: `Your booking ${orderNumber} status is now: ${humanizeOrderStatus(status)}.`,
  });
}

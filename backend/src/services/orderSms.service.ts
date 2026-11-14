import type { SmsLogStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { env, isProduction } from "../config/env";
import { logger } from "../utils/logger";
import { resolveOwningOrganizationIds } from "./franchiseOrderScope";
import { deliverSms, SmsDeliveryError } from "./sms.service";

/**
 * DLT-template transactional SMS for the order lifecycle — the port of the
 * legacy PHP system's `sendSms($to, $data, $templateName)`, reading
 * the same templates (now the `sms_templates` table, seeded verbatim from the
 * legacy one).
 *
 * Every send here is best-effort by design: it never throws, so a gateway
 * outage or a bad number can never fail the booking/assignment/report action
 * that triggered it. The outcome of each attempt lands in `sms_logs` instead.
 */

export type SmsTemplateKey =
  | "Order_Received_Admin"
  | "Order_Received"
  | "Test_Booking_Confirmation"
  | "Sample_Boy_Assigned"
  | "Order_Assigned"
  | "Sample_Accepted"
  | "Sample_Rejected"
  | "Report_Download";

/** DLT `{#var#}` slots accept at most 30 characters — a longer value gets
 *  the whole message rejected by the operator, so clip instead. */
const DLT_VARIABLE_MAX_LENGTH = 30;

/** Normalises the formats mobiles are actually stored in ("+91 98…",
 *  "098…", "9198…") down to the bare 10 digits the gateway expects. Returns
 *  null for anything that isn't a valid Indian mobile. */
export function normalizeMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

function clip(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= DLT_VARIABLE_MAX_LENGTH) return clean;
  return `${clean.slice(0, DLT_VARIABLE_MAX_LENGTH - 3).trimEnd()}...`;
}

function fillTemplate(body: string, vars: Record<string, string | null | undefined>): string {
  return body.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = vars[key];
    return value && value.trim() ? clip(value) : "-";
  });
}

async function writeLog(entry: {
  templateKey: string;
  mobile: string;
  message: string;
  status: SmsLogStatus;
  response?: string | null;
  orderId?: string | null;
}): Promise<void> {
  try {
    await prisma.smsLog.create({
      data: {
        templateKey: entry.templateKey,
        mobile: entry.mobile.slice(0, 15),
        message: entry.message,
        status: entry.status,
        response: entry.response?.slice(0, 2000) ?? null,
        orderId: entry.orderId ?? null,
      },
    });
  } catch (error) {
    logger.error("Failed to write SMS log", {
      templateKey: entry.templateKey,
      error: String(error),
    });
  }
}

/** Per-key promise chain. Dedupe is check-then-write against `sms_logs`, so
 *  two triggers for the same moment racing each other (payment verify +
 *  webhook, a bulk sample approval) would both pass the check — chaining
 *  them on one key makes the second see the first's log row. The API runs as
 *  a single PM2 process, so an in-memory lock is sufficient. */
const sendLocks = new Map<string, Promise<void>>();

function withLock(key: string, task: () => Promise<void>): Promise<void> {
  const previous = sendLocks.get(key) ?? Promise.resolve();
  const next = previous.then(task, task);
  sendLocks.set(key, next);
  void next.finally(() => {
    if (sendLocks.get(key) === next) sendLocks.delete(key);
  });
  return next;
}

/** Sends one template SMS to each number (deduplicated). Never throws. */
export async function sendTemplateSms(
  key: SmsTemplateKey,
  mobiles: (string | null | undefined)[],
  vars: Record<string, string | null | undefined>,
  context: SendContext = {},
): Promise<void> {
  if (context.dedupe && context.orderId) {
    return withLock(`${key}:${context.orderId}`, () => sendUnlocked(key, mobiles, vars, context));
  }
  return sendUnlocked(key, mobiles, vars, context);
}

interface SendContext {
  orderId?: string | null;
  /** Skip a recipient who already got this exact message for this order —
   *  for events that can fire more than once for the same moment (payment
   *  verify + webhook, bulk sample approval). */
  dedupe?: boolean;
}

async function sendUnlocked(
  key: SmsTemplateKey,
  mobiles: (string | null | undefined)[],
  vars: Record<string, string | null | undefined>,
  context: SendContext,
): Promise<void> {
  try {
    const recipients = [...new Set(mobiles.map(normalizeMobile).filter((m): m is string => !!m))];
    if (recipients.length === 0) return;

    const template = await prisma.smsTemplate.findUnique({ where: { key } });
    if (!template || !template.isActive) {
      for (const mobile of recipients) {
        await writeLog({
          templateKey: key,
          mobile,
          message: "",
          status: "SKIPPED",
          response: template ? "Template is inactive" : "Template not found",
          orderId: context.orderId,
        });
      }
      return;
    }

    const message = fillTemplate(template.body, vars);

    for (const mobile of recipients) {
      if (context.dedupe && context.orderId) {
        const already = await prisma.smsLog.findFirst({
          where: {
            templateKey: key,
            orderId: context.orderId,
            mobile,
            message,
            status: { not: "FAILED" },
          },
          select: { id: true },
        });
        if (already) continue;
      }

      if (!isProduction) {
        logger.info("SMS (dev, not sent)", { templateKey: key, mobile, message });
        await writeLog({
          templateKey: key,
          mobile,
          message,
          status: "SKIPPED",
          response: "Not sent outside production",
          orderId: context.orderId,
        });
        continue;
      }

      try {
        const response = await deliverSms(mobile, message, template.dltTemplateId);
        await writeLog({
          templateKey: key,
          mobile,
          message,
          status: "SENT",
          response,
          orderId: context.orderId,
        });
      } catch (error) {
        await writeLog({
          templateKey: key,
          mobile,
          message,
          status: "FAILED",
          response:
            error instanceof SmsDeliveryError
              ? error.gatewayResponse
              : error instanceof Error
                ? error.message
                : String(error),
          orderId: context.orderId,
        });
      }
    }
  } catch (error) {
    logger.error("Template SMS failed", { templateKey: key, error: String(error) });
  }
}

const orderAlertNumbers = (): string[] => env.SMS_ORDER_ALERT_NUMBERS;

// ---------------------------------------------------------------------------
// Order-lifecycle events. Each loads what it needs by id, so call sites only
// add one line after their own transaction commits, and each is safe to fire
// without awaiting (`void smsOn…(…)`).
// ---------------------------------------------------------------------------

const orderSmsInclude = {
  appUser: { select: { name: true, mobile: true } },
  address: true,
  slot: { select: { startTime: true, endTime: true } },
  slotTemplate: { select: { startTime: true, endTime: true } },
  phlebotomist: { select: { name: true, mobile: true } },
  items: {
    select: {
      name: true,
      familyMember: { select: { patient: { select: { firstName: true, lastName: true } } } },
    },
  },
  homeVisitFamilyMember: {
    select: { patient: { select: { firstName: true, lastName: true } } },
  },
} as const;

function personName(patient: { firstName: string; lastName: string } | null | undefined) {
  return patient ? `${patient.firstName} ${patient.lastName}`.trim() : "";
}

function joinUnique(values: (string | null | undefined)[]): string {
  return [...new Set(values.filter((v): v is string => !!v && !!v.trim()))].join(", ");
}

function formatDate(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${date.getUTCFullYear()}`;
}

async function loadOrder(orderId: string) {
  return prisma.appOrder.findUnique({ where: { id: orderId }, include: orderSmsInclude });
}

type SmsOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

function customerName(order: SmsOrder): string {
  return (
    order.appUser.name?.trim() ||
    personName(order.items[0]?.familyMember.patient) ||
    personName(order.homeVisitFamilyMember?.patient) ||
    "Customer"
  );
}

function testSummary(order: SmsOrder): string {
  return (
    joinUnique(order.items.map((i) => i.name)) ||
    (order.orderType === "HOME_VISIT" ? "Home Visit" : "Lab Test")
  );
}

function slotLabel(order: SmsOrder): string {
  const slot = order.slot ?? order.slotTemplate;
  const day = formatDate(order.orderDate);
  return slot ? `${day} ${slot.startTime}-${slot.endTime}` : day;
}

function addressLabel(order: SmsOrder): string {
  const a = order.address;
  if (!a) return "";
  return joinUnique([a.houseNo, a.address, a.locality, a.city]);
}

async function owningFranchises(order: SmsOrder) {
  const ids = await resolveOwningOrganizationIds(order);
  if (ids.length === 0) return [];
  return prisma.organization.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, name: true, labName: true, mobile: true },
  });
}

/** A new booking: the owning franchise(s) plus head office get
 *  `Order_Received_Admin`, the customer gets `Test_Booking_Confirmation`. */
export async function smsOnOrderConfirmed(orderId: string): Promise<void> {
  try {
    const order = await loadOrder(orderId);
    if (!order || order.isDraft) return;

    const franchises = await owningFranchises(order);
    const center =
      joinUnique(franchises.map((f) => f.labName || f.name)) ||
      `Not Assigned${order.address?.city ? ` (${order.address.city})` : ""}`;
    const name = customerName(order);
    const test = testSummary(order);

    await sendTemplateSms(
      "Order_Received_Admin",
      [...franchises.map((f) => f.mobile), ...orderAlertNumbers()],
      { orderId: order.orderNumber, test, name, center },
      { orderId: order.id, dedupe: true },
    );
    await sendTemplateSms(
      "Test_Booking_Confirmation",
      [order.appUser.mobile],
      { name, test, orderId: order.orderNumber },
      { orderId: order.id, dedupe: true },
    );
  } catch (error) {
    logger.error("Order-confirmed SMS failed", { orderId, error: String(error) });
  }
}

/** `Order_Received` to any franchise that has just become responsible for an
 *  existing order — the legacy "order assigned to lab" SMS. */
export async function smsOnFranchiseHandover(
  orderId: string,
  previousOwnerIds: string[],
): Promise<void> {
  try {
    const order = await loadOrder(orderId);
    if (!order || order.isDraft) return;
    const added = (await owningFranchises(order)).filter((f) => !previousOwnerIds.includes(f.id));
    if (added.length === 0) return;

    await sendTemplateSms(
      "Order_Received",
      added.map((f) => f.mobile),
      { orderId: order.orderNumber, test: testSummary(order), name: customerName(order) },
      { orderId: order.id, dedupe: true },
    );
  } catch (error) {
    logger.error("Franchise-handover SMS failed", { orderId, error: String(error) });
  }
}

/** A phlebo assigned (or reassigned): the customer gets
 *  `Sample_Boy_Assigned`, the phlebo gets `Order_Assigned`. */
export async function smsOnPhleboAssigned(orderId: string): Promise<void> {
  try {
    const order = await loadOrder(orderId);
    if (!order || !order.phlebotomist) return;
    const name = customerName(order);

    await sendTemplateSms(
      "Sample_Boy_Assigned",
      [order.appUser.mobile],
      {
        name,
        boy: order.phlebotomist.name,
        phone: order.phlebotomist.mobile,
        time: slotLabel(order),
      },
      { orderId: order.id },
    );
    await sendTemplateSms(
      "Order_Assigned",
      [order.phlebotomist.mobile],
      { orderId: order.orderNumber, name, address: addressLabel(order) },
      { orderId: order.id },
    );
  } catch (error) {
    logger.error("Phlebo-assigned SMS failed", { orderId, error: String(error) });
  }
}

/** Lab-side SMS only exist for appointments booked through the app/website
 *  (`AppOrderAppointment`): a LIMS walk-in has no app order, and the report
 *  template tells the patient to "download it from App". */
async function loadAppointmentForSms(appointmentId: string) {
  return prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      patient: { select: { firstName: true, lastName: true } },
      tests: { select: { testName: true } },
      samples: { select: { status: true } },
      appOrderAppointment: {
        select: {
          order: { select: { id: true, appUser: { select: { name: true, mobile: true } } } },
        },
      },
    },
  });
}

/** `Sample_Accepted` once every sample of the appointment has passed lab QC
 *  (one SMS per patient, not one per tube); `Sample_Rejected` immediately for
 *  the rejected sample's own tests. */
export async function smsOnSampleStatus(
  sampleId: string,
  outcome: "APPROVED" | "REJECTED",
): Promise<void> {
  try {
    const sample = await prisma.sample.findUnique({
      where: { id: sampleId },
      select: { appointmentId: true, tests: { select: { test: { select: { name: true } } } } },
    });
    if (!sample) return;
    const appointment = await loadAppointmentForSms(sample.appointmentId);
    const order = appointment?.appOrderAppointment?.order;
    if (!appointment || !order) return;

    const name = personName(appointment.patient) || order.appUser.name || "Customer";

    if (outcome === "REJECTED") {
      await sendTemplateSms(
        "Sample_Rejected",
        [order.appUser.mobile],
        { name, test: joinUnique(sample.tests.map((t) => t.test.name)) || "Lab Test" },
        { orderId: order.id, dedupe: true },
      );
      return;
    }

    const allApproved = appointment.samples.every((s) => s.status === "APPROVED");
    if (!allApproved) return;
    await sendTemplateSms(
      "Sample_Accepted",
      [order.appUser.mobile],
      { name, test: joinUnique(appointment.tests.map((t) => t.testName)) || "Lab Test" },
      { orderId: order.id, dedupe: true },
    );
  } catch (error) {
    logger.error("Sample-status SMS failed", { sampleId, outcome, error: String(error) });
  }
}

/** `Report_Download` when an app-booked appointment's report is approved. */
export async function smsOnReportReady(appointmentId: string): Promise<void> {
  try {
    const appointment = await loadAppointmentForSms(appointmentId);
    const order = appointment?.appOrderAppointment?.order;
    if (!appointment || !order) return;

    await sendTemplateSms(
      "Report_Download",
      [order.appUser.mobile],
      {
        name: personName(appointment.patient) || order.appUser.name || "Customer",
        test: joinUnique(appointment.tests.map((t) => t.testName)) || "Lab Test",
      },
      { orderId: order.id, dedupe: true },
    );
  } catch (error) {
    logger.error("Report-ready SMS failed", { appointmentId, error: String(error) });
  }
}

import type Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../../../config/database";
import { ApiError } from "../../../utils/ApiError";
import { logger } from "../../../utils/logger";
import { isAffirmative } from "../intent.util";
import {
  bookingConfirmationText,
  confirmDraft,
  confirmFailureText,
  saveDraft,
} from "../booking.service";
import {
  checkServiceability,
  getPriceQuote,
  getSlots,
  searchCatalogue,
  suggestForConcern,
} from "./catalogue.tools";
import {
  cancelBooking,
  getMyOrders,
  getMyProfiles,
  getOrderStatus,
  getReportLink,
  handoffToTeam,
  requestReschedule,
} from "./orders.tools";
import { ToolError, trackAmounts, type ToolContext } from "./context";

/** Tool list — a fixed, ordered array so the prompt-cache prefix stays
 *  byte-identical between requests. No tool takes a phone number. */
export const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_catalogue",
    description:
      "Search OUR catalogue for tests and packages by name/short name (e.g. 'CBC', 'thyroid', 'full body'). " +
      "Returns up to 8 matches with id, price, sample, fasting, report time and what a package includes. " +
      "Pass the pincode once known so only items offered there come back.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Test/package name or keyword, in English." },
        pincode: { type: "string", description: "6-digit pincode, if known." },
      },
      required: ["query"],
    },
  },
  {
    name: "suggest_for_concern",
    description:
      "For a health concern or symptoms ('bukhar', 'sugar check', 'weakness'). Returns ONLY the tests our medical " +
      "team has mapped to that concern. This is the only allowed source of symptom-based suggestions.",
    input_schema: {
      type: "object",
      properties: {
        concern: {
          type: "string",
          description: "The customer's concern, in English keywords plus their words.",
        },
        pincode: { type: "string" },
      },
      required: ["concern"],
    },
  },
  {
    name: "check_serviceability",
    description:
      "Check whether we do home collection at a 6-digit pincode (preferred) or in a city.",
    input_schema: {
      type: "object",
      properties: { city_or_pincode: { type: "string" } },
      required: ["city_or_pincode"],
    },
  },
  {
    name: "get_slots",
    description:
      "Open home-collection time slots for a pincode on a date (YYYY-MM-DD), with remaining capacity.",
    input_schema: {
      type: "object",
      properties: {
        pincode: { type: "string" },
        date: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["pincode", "date"],
    },
  },
  {
    name: "get_price_quote",
    description:
      "Authoritative price for the selected tests/packages at a pincode, including the home collection charge. " +
      "Quote only what this returns.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["TEST", "PACKAGE"] },
              id: { type: "string" },
            },
            required: ["type", "id"],
          },
        },
        pincode: { type: "string" },
        patient_count: { type: "integer", minimum: 1, maximum: 6 },
      },
      required: ["items", "pincode"],
    },
  },
  {
    name: "get_my_profiles",
    description:
      "Patients already saved on this customer's account (self and family). Use to offer booking for an existing person.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "save_booking_draft",
    description:
      "Validate and save the booking the customer wants. Our system then sends them the official summary with " +
      "Confirm / Change / Cancel buttons — you do not write the summary yourself. Call only once you have the " +
      "patient, item(s) (or home visit notes), full address with pincode, date and a slot_id from get_slots.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["catalog", "home_visit"] },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["TEST", "PACKAGE"] },
              id: { type: "string" },
            },
            required: ["type", "id"],
          },
        },
        symptom_notes: { type: "string", description: "Home visit only: what the patient needs." },
        patient: {
          type: "object",
          properties: {
            family_member_id: {
              type: "string",
              description: "From get_my_profiles, to reuse a saved patient.",
            },
            name: { type: "string" },
            gender: { type: "string", enum: ["male", "female", "other"] },
            dob: { type: "string", description: "YYYY-MM-DD, preferred" },
            age: { type: "integer", description: "Only if the date of birth is not known" },
            relation: {
              type: "string",
              enum: [
                "self",
                "father",
                "mother",
                "spouse",
                "son",
                "daughter",
                "brother",
                "sister",
                "other",
              ],
            },
          },
        },
        address: {
          type: "object",
          properties: {
            house_no: { type: "string" },
            address_line: { type: "string", description: "Street / colony / building" },
            locality: { type: "string" },
            landmark: { type: "string" },
            pincode: { type: "string" },
            latitude: { type: "number" },
            longitude: { type: "number" },
          },
          required: ["address_line", "pincode"],
        },
        date: { type: "string", description: "YYYY-MM-DD" },
        slot_id: { type: "string" },
      },
      required: ["patient", "address", "date", "slot_id"],
    },
  },
  {
    name: "confirm_booking",
    description:
      "Book a saved draft. ONLY when the customer's latest message explicitly confirms the summary we just sent " +
      "(e.g. 'yes', 'haan confirm'). If they tapped the Confirm button the system books it automatically.",
    input_schema: {
      type: "object",
      properties: { draft_id: { type: "string" } },
      required: ["draft_id"],
    },
  },
  {
    name: "get_my_orders",
    description:
      "This customer's latest orders: status, date, slot, tests, phlebotomist, report status.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_order_status",
    description: "One of this customer's orders by order number (e.g. ORD000123).",
    input_schema: {
      type: "object",
      properties: { order_number: { type: "string" } },
      required: ["order_number"],
    },
  },
  {
    name: "get_report_link",
    description:
      "Short-lived download link for a ready report. Requires the order number AND the patient's date of birth " +
      "as given by the customer (never guess or reuse one you already know).",
    input_schema: {
      type: "object",
      properties: {
        order_number: { type: "string" },
        patient_dob: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["order_number", "patient_dob"],
    },
  },
  {
    name: "request_reschedule",
    description: "Move one of this customer's bookings to a new date and slot_id (from get_slots).",
    input_schema: {
      type: "object",
      properties: {
        order_number: { type: "string" },
        date: { type: "string" },
        slot_id: { type: "string" },
      },
      required: ["order_number", "date", "slot_id"],
    },
  },
  {
    name: "cancel_booking",
    description:
      "Cancel one of this customer's bookings. Ask first; call only when their latest message is an explicit yes.",
    input_schema: {
      type: "object",
      properties: { order_number: { type: "string" }, reason: { type: "string" } },
      required: ["order_number", "reason"],
    },
  },
  {
    name: "handoff_to_team",
    description:
      "Pass the chat to a human: complaints, refunds, payment problems, anger, anything outside the catalogue, " +
      "medical emergencies, or when the customer asks for a person.",
    input_schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "complaint | refund | emergency | request_human | out_of_scope | other",
        },
        summary: { type: "string", description: "One or two lines for the team." },
      },
      required: ["reason", "summary"],
    },
  },
  {
    name: "reply_with_options",
    description:
      "End your turn with a tappable WhatsApp list instead of plain text — for choosing a slot, a test/package, or " +
      "a menu choice. Option ids must come from tool results this turn: 'slot:<slot_id>', 'test:<id>', 'pkg:<id>'. " +
      "Max 10 options; title max 24 chars, description max 72.",
    input_schema: {
      type: "object",
      properties: {
        body: { type: "string", description: "Short message above the list." },
        button_label: { type: "string", description: "Max 20 chars, e.g. 'Choose slot'" },
        options: {
          type: "array",
          maxItems: 10,
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
            },
            required: ["id", "title"],
          },
        },
      },
      required: ["body", "button_label", "options"],
    },
  },
];

/** Tools that end the turn instead of returning a result to the model. */
export const TERMINAL_TOOLS = new Set(["reply_with_options"]);

async function confirmTyped(ctx: ToolContext, input: { draft_id: string }) {
  if (!isAffirmative(ctx.inbound.text)) {
    throw new ToolError(
      "The customer has not explicitly confirmed. Ask them to tap Confirm on the summary or reply 'yes'.",
    );
  }
  if (ctx.dryRun || !ctx.conversationId || !ctx.phone) {
    return { simulated: true, message: "Dry run — no booking created." };
  }
  // The yes must answer THIS draft's summary: it has to be the newest thing
  // we sent, with nothing else in between.
  const lastOut = await prisma.whatsappMessage.findFirst({
    where: { conversationId: ctx.conversationId, direction: "OUT", status: { not: "failed" } },
    orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
  });
  const payload = lastOut?.payload as { buttons?: Array<{ id: string }> } | null;
  const confirmId = payload?.buttons?.[0]?.id ?? "";
  if (!confirmId.startsWith(`wa_confirm:${input.draft_id}:`)) {
    throw new ToolError(
      "That draft's summary is not the latest message. Save the draft again to re-send it.",
    );
  }
  const outcome = await confirmDraft(
    ctx.conversationId,
    ctx.phone,
    input.draft_id,
    confirmId.split(":")[2],
  );
  ctx.turn.stateChanged = true;
  if (outcome.ok) {
    trackAmounts(ctx.turn, outcome.total);
    return { ok: true, message_for_customer: bookingConfirmationText(outcome) };
  }
  return { ok: false, message_for_customer: confirmFailureText(outcome) };
}

function replyWithOptions(
  ctx: ToolContext,
  input: {
    body: string;
    button_label: string;
    options: Array<{ id: string; title: string; description?: string }>;
  },
) {
  const options = (input.options ?? []).slice(0, 10);
  const bad = options.filter(
    (o) => !ctx.turn.optionIds.has(o.id) && !/^menu:(book|orders|human)$/.test(o.id),
  );
  if (options.length === 0 || bad.length) {
    throw new ToolError(
      `Invalid option ids: ${bad.map((o) => o.id).join(", ") || "(none)"}. Use only ids returned by tools this turn.`,
    );
  }
  ctx.turn.options = {
    body: String(input.body ?? "").slice(0, 1000),
    button: String(input.button_label ?? "Choose").slice(0, 20),
    rows: options.map((o) => ({ id: o.id, title: o.title, description: o.description })),
  };
  return { ok: true };
}

type Handler = (ctx: ToolContext, input: never) => Promise<unknown> | unknown;

const HANDLERS: Record<string, Handler> = {
  search_catalogue: searchCatalogue,
  suggest_for_concern: suggestForConcern,
  check_serviceability: checkServiceability,
  get_slots: getSlots,
  get_price_quote: getPriceQuote,
  get_my_profiles: getMyProfiles,
  save_booking_draft: async (ctx, input) => {
    const draft = await saveDraft(ctx, input);
    return {
      ok: true,
      draft_id: draft.draftId,
      total: draft.payload.quote.total,
      note: "Summary with Confirm/Change/Cancel buttons will be sent to the customer by the system. Do not repeat it.",
    };
  },
  confirm_booking: confirmTyped,
  get_my_orders: getMyOrders,
  get_order_status: getOrderStatus,
  get_report_link: getReportLink,
  request_reschedule: requestReschedule,
  cancel_booking: cancelBooking,
  handoff_to_team: handoffToTeam,
  reply_with_options: replyWithOptions,
};

export interface ToolRun {
  name: string;
  input: unknown;
  ok: boolean;
  /** Short result for the AI log — never the full payload. */
  result: string;
}

/** Runs one tool call. Expected failures (bad input, unavailable slot, …)
 *  come back to the model as an error result it can recover from; anything
 *  unexpected is logged and reported generically. */
export async function executeTool(
  ctx: ToolContext,
  name: string,
  input: unknown,
): Promise<{ content: string; isError: boolean; run: ToolRun }> {
  const handler = HANDLERS[name];
  let content: string;
  let isError = false;
  try {
    if (!handler) throw new ToolError(`Unknown tool ${name}`);
    const result = await handler(ctx, (input ?? {}) as never);
    content = JSON.stringify(result);
  } catch (error) {
    isError = true;
    if (error instanceof ToolError || error instanceof ApiError) {
      content = JSON.stringify({ error: error.message });
    } else {
      content = JSON.stringify({
        error: "Temporary problem — offer to connect the customer with our team.",
      });
      // Logged without the input: it can carry patient details.
      logger.error("WhatsApp tool failed", { tool: name, error: String(error) });
    }
  }
  return {
    content,
    isError,
    run: { name, input, ok: !isError, result: content.slice(0, 300) },
  };
}

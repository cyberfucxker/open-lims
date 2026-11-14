/** Server-side state every tool call gets. The customer's phone number lives
 *  HERE, injected by the executor from the verified WhatsApp sender — it is
 *  never a tool parameter, so the model has no way to ask about anyone else. */
export interface ToolContext {
  /** Null in the Superadmin "Try it" box. */
  conversationId: string | null;
  /** Verified sender, normalised to the 10-digit `AppUser.mobile` format
   *  (null for a non-Indian number — such a sender has no orders). */
  phone: string | null;
  /** Dry run ("Try it"): reads are real, every write is simulated. */
  dryRun: boolean;
  /** The message this turn is answering. */
  inbound: {
    text: string;
    /** `interactive.*.id` when the customer tapped a button/list row. */
    replyId: string | null;
  };
  /** Collected while the turn runs. */
  turn: TurnState;
}

export interface TurnState {
  /** Every rupee amount a tool returned this turn — a reply may only quote
   *  these (plus amounts already shown earlier in the chat). */
  amounts: Set<number>;
  /** Option ids tools returned this turn — `reply_with_options` may only
   *  offer these, so the model can't invent a slot or test id. */
  optionIds: Set<string>;
  /** Set by `save_booking_draft`: the code-built summary to send with the
   *  Confirm / Change / Cancel buttons instead of the model's own text. */
  summary: { draftId: string; text: string; hash: string } | null;
  /** Set by `reply_with_options`: ends the turn with a list/buttons message. */
  options: {
    body: string;
    button: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  } | null;
  /** A booking/cancel/reschedule/handoff happened — this turn's reply must be
   *  delivered even if a newer customer message has arrived meanwhile. */
  stateChanged: boolean;
  handoff: { reason: string; summary: string } | null;
}

export function newTurnState(): TurnState {
  return {
    amounts: new Set(),
    optionIds: new Set(),
    summary: null,
    options: null,
    stateChanged: false,
    handoff: null,
  };
}

/** Records every money field a tool result carries. */
export function trackAmounts(turn: TurnState, ...values: Array<number | null | undefined>) {
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) turn.amounts.add(Math.round(v * 100) / 100);
  }
}

export class ToolError extends Error {}

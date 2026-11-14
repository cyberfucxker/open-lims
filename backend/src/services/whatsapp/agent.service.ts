import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../../config/database";
import { logger } from "../../utils/logger";
import { buildDateNote, buildSystemPrompt } from "./agent.prompt";
import { executeTool, TERMINAL_TOOLS, TOOLS, type ToolRun } from "./tools";
import type { ToolContext } from "./tools/context";
import type { RuntimeSettings } from "./settings.service";

/**
 * One AI turn: history → Claude (with tools) → tool loop → reply text.
 * The model never sends anything itself; the caller decides what goes out.
 */

const MAX_ROUNDS = 6;
export const HISTORY_LIMIT = 14;
const MAX_MESSAGE_CHARS = 1000;

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface AgentUsage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export interface AgentResult {
  /** Empty when the turn ended in a handoff, summary or options message. */
  text: string;
  toolRuns: ToolRun[];
  usage: AgentUsage;
  /** Set when the model could not or should not answer — refusal,
   *  max_tokens, too many rounds, or an unfixable price mismatch. */
  forcedHandoff: string | null;
}

/** Shapes stored chat rows into a valid Messages API history: user/assistant
 *  alternating, starting and ending with the customer. */
export function toApiMessages(turns: ChatTurn[]): Anthropic.MessageParam[] {
  const merged: ChatTurn[] = [];
  for (const turn of turns) {
    const text = turn.text.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!text) continue;
    const last = merged[merged.length - 1];
    if (last && last.role === turn.role) last.text += `\n${text}`;
    else merged.push({ role: turn.role, text });
  }
  while (merged.length && merged[0].role !== "user") merged.shift();
  while (merged.length && merged[merged.length - 1].role !== "user") merged.pop();
  return merged.map((t) => ({ role: t.role, content: t.text }));
}

const AMOUNT_RE =
  /(?:₹|rs\.?|inr|rupees?)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:₹|\/-|rs\b|rupees?)/gi;

export function extractAmounts(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(AMOUNT_RE)) {
    const n = Number((m[1] ?? m[2]).replace(/,/g, ""));
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

/** Amounts in the reply that no tool returned (this turn) and that we have
 *  not already sent earlier in the chat. */
export function unsupportedAmounts(
  reply: string,
  allowed: Set<number>,
  history: ChatTurn[],
): number[] {
  const seen = new Set(allowed);
  for (const turn of history)
    if (turn.role === "assistant") for (const n of extractAmounts(turn.text)) seen.add(n);
  return extractAmounts(reply).filter((n) => !seen.has(n));
}

/** Markdown the model may slip in → WhatsApp formatting. */
export function toWhatsappText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1: $2")
    .trim();
}

export async function loadKnowledge() {
  return prisma.whatsappKnowledgeEntry.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { title: true, body: true },
  });
}

export async function runAgent(
  settings: RuntimeSettings,
  history: ChatTurn[],
  ctx: ToolContext,
): Promise<AgentResult> {
  if (!settings.anthropicKey) throw new Error("Anthropic API key is not configured");
  const client = new Anthropic({ apiKey: settings.anthropicKey, maxRetries: 2, timeout: 60_000 });

  const system: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: buildSystemPrompt({
        brandName: settings.brandName,
        businessInstructions: settings.businessInstructions,
        knowledge: await loadKnowledge(),
      }),
      cache_control: { type: "ephemeral" },
    },
  ];
  const messages: Anthropic.MessageParam[] = [
    ...toApiMessages(history),
    { role: "system", content: buildDateNote() },
  ];
  if (messages.length < 2) throw new Error("Nothing to answer");

  const usage: AgentUsage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  const toolRuns: ToolRun[] = [];
  let priceRetryUsed = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await client.messages.create({
      model: settings.model,
      max_tokens: 16000,
      system,
      tools: TOOLS,
      messages,
      output_config: { effort: "low" },
    });
    usage.input += response.usage.input_tokens;
    usage.output += response.usage.output_tokens;
    usage.cacheRead += response.usage.cache_read_input_tokens ?? 0;
    usage.cacheWrite += response.usage.cache_creation_input_tokens ?? 0;

    if (response.stop_reason === "refusal") {
      return { text: "", toolRuns, usage, forcedHandoff: "refusal" };
    }
    if (
      response.stop_reason === "max_tokens" ||
      response.stop_reason === "model_context_window_exceeded"
    ) {
      return { text: "", toolRuns, usage, forcedHandoff: response.stop_reason };
    }

    if (response.stop_reason === "tool_use") {
      // The full content — thinking blocks included — goes back unchanged.
      messages.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      let terminal = false;
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const { content, isError, run } = await executeTool(ctx, block.name, block.input);
        toolRuns.push(run);
        results.push({ type: "tool_result", tool_use_id: block.id, content, is_error: isError });
        if (!isError && TERMINAL_TOOLS.has(block.name)) terminal = true;
      }
      // A saved draft (summary + buttons) or an options list ends the turn —
      // the system sends those itself.
      if (terminal || ctx.turn.summary) {
        return { text: "", toolRuns, usage, forcedHandoff: null };
      }
      messages.push({ role: "user", content: results });
      continue;
    }

    const text = toWhatsappText(
      response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n"),
    );
    if (ctx.turn.summary || ctx.turn.options) {
      return { text: "", toolRuns, usage, forcedHandoff: null };
    }

    const bad = unsupportedAmounts(text, ctx.turn.amounts, history);
    if (bad.length) {
      if (priceRetryUsed) {
        logger.warn("WhatsApp AI quoted an unsupported amount twice", { amounts: bad });
        return { text: "", toolRuns, usage, forcedHandoff: "unsupported_price" };
      }
      priceRetryUsed = true;
      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content:
          `[system check] Your reply quoted ${bad.map((n) => `₹${n}`).join(", ")}, which no tool returned. ` +
          "Rewrite the reply without it. If a price is needed, call get_price_quote and quote only its numbers.",
      });
      continue;
    }

    return { text, toolRuns, usage, forcedHandoff: text ? null : "empty_reply" };
  }

  return { text: "", toolRuns, usage, forcedHandoff: "too_many_rounds" };
}

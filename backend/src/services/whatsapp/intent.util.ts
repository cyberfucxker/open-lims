/**
 * Pure, deterministic message classifiers that run BEFORE the LLM. Anything
 * decided here (greeting menu, red-flag symptoms, acknowledgements, explicit
 * confirmation) is enforced in code rather than left to the model.
 */

/** Indian mobile as stored on `AppUser.mobile` (10 digits), from a WhatsApp
 *  `wa_id` ("919876543210") or anything a person might type. Null for a
 *  non-Indian / malformed number. */
export function normalizeIndianMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  const local =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

function clean(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, " ")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const GREETING =
  /^(hi+|hello+|hey+|helo|hii+|namaste|namaskar|namaskaar|ram ram|jai shree krishna|good (morning|afternoon|evening)|नमस्ते|नमस्कार|हेलो|हाय)( (ji|sir|madam|there))?$/u;

/** A bare greeting with nothing else in it — answered with the menu. */
export function isGreeting(text: string): boolean {
  return GREETING.test(clean(text));
}

const ACK =
  /^(ok+|okay|okk+|k|kk|thanks?|thank you|thanku|thnx|thx|ty|dhanyavad|dhanyawad|shukriya|theek hai|thik hai|ji|ji haan|accha|acha|achha|great|nice|cool|done|sure|👍|🙏|धन्यवाद|ठीक है)$/u;

/** Pure acknowledgement ("ok", "thanks", 👍) — no reply needed, unless the
 *  customer is answering a pending confirmation (the caller checks that). */
export function isAcknowledgement(text: string): boolean {
  const raw = text.trim();
  if (/^[\p{Extended_Pictographic}\p{Emoji_Modifier}️‍\s]+$/u.test(raw)) return true;
  return ACK.test(clean(text));
}

/** Every word of an affirmative reply must come from this vocabulary, and
 *  at least one must be a real "yes" — so "haan confirm karo" passes while
 *  "yes but change the date" does not. */
const AFFIRM_CORE = new Set([
  "yes",
  "yep",
  "yeah",
  "ok",
  "okay",
  "confirm",
  "confirmed",
  "haan",
  "haa",
  "han",
  "ha",
  "theek",
  "thik",
  "sahi",
  "done",
  "proceed",
  "sure",
  "book",
  "हाँ",
  "हां",
  "ठीक",
  "कन्फर्म",
]);
const AFFIRM_FILLER = new Set([
  "ji",
  "hai",
  "karo",
  "kar",
  "do",
  "kardo",
  "karein",
  "kijiye",
  "go",
  "ahead",
  "please",
  "plz",
  "pls",
  "it",
  "jee",
  "जी",
  "है",
  "करो",
  "कर",
  "दो",
]);

/** An unambiguous "yes" to the last thing we asked. */
export function isAffirmative(text: string): boolean {
  const words = clean(text).split(" ").filter(Boolean);
  return (
    words.length > 0 &&
    words.length <= 5 &&
    words.every((w) => AFFIRM_CORE.has(w) || AFFIRM_FILLER.has(w)) &&
    words.some((w) => AFFIRM_CORE.has(w))
  );
}

/** Symptoms where we must NOT push a booking — the customer is told to seek
 *  a doctor / emergency care at once and the chat goes to a human. Matching
 *  is deliberately broad: a false positive costs a handoff, a false negative
 *  could cost far more. */
const RED_FLAG_PATTERNS: RegExp[] = [
  /chest pain|seene (me|mein|mai) (dard|pain)|chhati (me|mein) dard|सीने में दर्द|छाती में दर्द/u,
  /breathless|can.?t breathe|cannot breathe|difficulty breathing|shortness of breath|saans (nahi|lene me|lene mein|phool)|सांस (नहीं|लेने में)/u,
  /unconscious|faint(ed|ing)?|passed out|behosh|बेहोश|chakkar (aa ke|aakar) gir/u,
  /stroke|paralys|lakwa|लकवा|face droop|munh tedha|slurred speech|zubaan (ladkhada|atak)/u,
  /seizure|convulsion|mirgi|daura pad|दौरा/u,
  /heavy bleeding|severe bleeding|bleeding (a lot|heavily|nahi ruk)|khoon (beh|nahi ruk|ki ulti)|blood (vomit|in vomit)|खून (बह|की उल्टी)/u,
  /suicid|kill myself|end my life|khudkushi|aatmahatya|mar jana chahta|jeena nahi chahta|आत्महत्या/u,
  /(infant|newborn|baby|bachche|shishu|navjaat)\b.*(high fever|tez bukhar|bahut bukhar)|(high fever|tez bukhar).*(infant|newborn|baby|navjaat|shishu)/u,
  /poison|zeher|जहर|overdose/u,
  /heart attack|dil ka daura|दिल का दौरा/u,
];

export function isRedFlag(text: string): boolean {
  const t = text.toLowerCase();
  return RED_FLAG_PATTERNS.some((re) => re.test(t));
}

const HUMAN_REQUEST =
  /(agent|human|insaan|real person|customer care|executive|staff|team member|manager|kisi se baat|baat karni|call (me|karo|kijiye)|phone karo|talk to (someone|a person|you)|एजेंट|बात करनी)/u;

/** "agent se baat karni hai" and friends — routed straight to a human. */
export function wantsHuman(text: string): boolean {
  return HUMAN_REQUEST.test(text.toLowerCase());
}

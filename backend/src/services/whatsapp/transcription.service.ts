/** Voice-note speech-to-text through an OpenAI-compatible
 *  `/audio/transcriptions` endpoint — Groq's whisper-large-v3-turbo by
 *  default (cheapest, has a free tier), OpenAI's whisper-1 as the alternative. */

const PROVIDERS = {
  groq: {
    url: "https://api.groq.com/openai/v1/audio/transcriptions",
    model: "whisper-large-v3-turbo",
  },
  openai: {
    url: "https://api.openai.com/v1/audio/transcriptions",
    model: "whisper-1",
  },
} as const;

export type SttProvider = keyof typeof PROVIDERS;

export function isSttProvider(value: string): value is SttProvider {
  return value in PROVIDERS;
}

/** ~2.5 MB of OGG/Opus voice is well over 15 minutes — anything bigger is
 *  not a booking request, and transcribing it would only cost money. */
export const MAX_VOICE_BYTES = 2.5 * 1024 * 1024;

/** Vocabulary hint — Whisper uses it as prior context, which noticeably
 *  improves test names and Hinglish spelling. */
const VOCABULARY_HINT =
  "Hindi, Hinglish or English WhatsApp voice message to a diagnostic lab about booking blood tests " +
  "and health checkups: CBC, thyroid, TSH, sugar, HbA1c, lipid profile, LFT, KFT, vitamin D, B12, " +
  "full body checkup, home collection, slot, report, order, bukhar, kamzori.";

export async function transcribe(
  provider: SttProvider,
  apiKey: string,
  audio: Buffer,
  mimeType: string,
): Promise<string> {
  if (audio.length > MAX_VOICE_BYTES) {
    throw new Error("Voice note is too long to transcribe");
  }
  const { url, model } = PROVIDERS[provider];
  const extension = mimeType.includes("mpeg") ? "mp3" : mimeType.includes("mp4") ? "m4a" : "ogg";

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), `voice.${extension}`);
  form.append("model", model);
  form.append("prompt", VOCABULARY_HINT);
  form.append("response_format", "json");
  form.append("temperature", "0");

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) {
    throw new Error(
      `Transcription failed (${response.status}): ${(await response.text()).slice(0, 200)}`,
    );
  }
  const text = ((await response.json()) as { text?: string }).text?.trim() ?? "";
  if (!text) {
    throw new Error("Transcription came back empty");
  }
  return text;
}

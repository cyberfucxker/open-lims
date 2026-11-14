import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import {
  isAcknowledgement,
  isAffirmative,
  isGreeting,
  isRedFlag,
  normalizeIndianMobile,
  wantsHuman,
} from "../../src/services/whatsapp/intent.util";
import { isWithinServiceWindow, toGraphPayload } from "../../src/services/whatsapp/cloudApi.client";
import { isValidSignature, parseMessage } from "../../src/services/whatsapp/webhook.service";
import {
  buildSummary,
  confirmButtonId,
  parseConfirmButtonId,
  summaryHash,
  type DraftPayload,
} from "../../src/services/whatsapp/booking.service";
import {
  extractAmounts,
  toApiMessages,
  toWhatsappText,
  unsupportedAmounts,
} from "../../src/services/whatsapp/agent.service";
import { assertBookableDate, todayIst } from "../../src/services/whatsapp/tools/catalogue.tools";
import {
  decryptSecret,
  encryptSecret,
  signPayload,
  verifySignature,
} from "../../src/utils/crypto.util";
import { signReportToken, verifyReportToken } from "../../src/services/whatsapp/tools/orders.tools";
import { TOOLS } from "../../src/services/whatsapp/tools";

describe("intent rules (run before the model)", () => {
  it("normalises WhatsApp ids to the 10-digit AppUser format", () => {
    expect(normalizeIndianMobile("919876543210")).toBe("9876543210");
    expect(normalizeIndianMobile("+91 98765 43210")).toBe("9876543210");
    expect(normalizeIndianMobile("09876543210")).toBe("9876543210");
    expect(normalizeIndianMobile("14155550123")).toBeNull();
  });

  it("greets only bare greetings", () => {
    expect(isGreeting("Hi")).toBe(true);
    expect(isGreeting("namaste ji 🙏")).toBe(true);
    expect(isGreeting("नमस्ते")).toBe(true);
    expect(isGreeting("hi, CBC ka price kya hai")).toBe(false);
  });

  it("ignores acknowledgements but not questions", () => {
    expect(isAcknowledgement("ok")).toBe(true);
    expect(isAcknowledgement("Thank you!")).toBe(true);
    expect(isAcknowledgement("👍")).toBe(true);
    expect(isAcknowledgement("ok but report kab aayegi?")).toBe(false);
  });

  it("detects explicit confirmation", () => {
    expect(isAffirmative("haan confirm karo")).toBe(true);
    expect(isAffirmative("Yes")).toBe(true);
    expect(isAffirmative("yes but change the date")).toBe(false);
  });

  it("flags red-flag symptoms in Hindi, Hinglish and English", () => {
    expect(isRedFlag("seene mein dard ho raha hai")).toBe(true);
    expect(isRedFlag("I have chest pain and sweating")).toBe(true);
    expect(isRedFlag("saans lene mein dikkat")).toBe(true);
    expect(isRedFlag("mere baby ko tez bukhar hai")).toBe(true);
    expect(isRedFlag("bukhar aur kamzori hai")).toBe(false);
  });

  it("routes requests for a person", () => {
    expect(wantsHuman("agent se baat karni hai")).toBe(true);
    expect(wantsHuman("CBC test book karna hai")).toBe(false);
  });
});

describe("WhatsApp Cloud API payloads", () => {
  it("clips button titles to 20 chars and keeps max 3 buttons", () => {
    const p = toGraphPayload("919876543210", {
      type: "buttons",
      body: "x",
      buttons: [
        { id: "a", title: "This title is far too long for WhatsApp" },
        { id: "b", title: "B" },
        { id: "c", title: "C" },
        { id: "d", title: "D" },
      ],
    }) as { interactive: { action: { buttons: Array<{ reply: { title: string } }> } } };
    expect(p.interactive.action.buttons).toHaveLength(3);
    expect(p.interactive.action.buttons[0].reply.title.length).toBeLessThanOrEqual(20);
  });

  it("caps a list at 10 rows across sections with 24/72-char limits", () => {
    const rows = Array.from({ length: 14 }, (_, i) => ({
      id: `r${i}`,
      title: `Row number ${i} with a long title`,
      description: "d".repeat(100),
    }));
    const p = toGraphPayload("91", {
      type: "list",
      body: "b",
      button: "Choose a slot please",
      sections: [{ title: "S", rows }],
    }) as {
      interactive: {
        action: {
          button: string;
          sections: Array<{ rows: Array<{ title: string; description: string }> }>;
        };
      };
    };
    const out = p.interactive.action.sections.flatMap((s) => s.rows);
    expect(out).toHaveLength(10);
    expect(out[0].title.length).toBeLessThanOrEqual(24);
    expect(out[0].description.length).toBeLessThanOrEqual(72);
    expect(p.interactive.action.button.length).toBeLessThanOrEqual(20);
  });

  it("adds quick-reply button payloads to a template", () => {
    const p = toGraphPayload("919876543210", {
      type: "template",
      name: "test_repeat_reminder",
      language: "en",
      bodyParams: ["Asha", "HbA1c", "1 Oct 2026"],
      buttonPayloads: ["rebook:1", "later:1"],
      preview: "x",
    }) as {
      template: {
        components: Array<{
          type: string;
          index?: string;
          parameters: Array<{ payload?: string; text?: string }>;
        }>;
      };
    };
    expect(p.template.components[0]).toMatchObject({ type: "body" });
    expect(p.template.components.slice(1)).toEqual([
      {
        type: "button",
        sub_type: "quick_reply",
        index: "0",
        parameters: [{ type: "payload", payload: "rebook:1" }],
      },
      {
        type: "button",
        sub_type: "quick_reply",
        index: "1",
        parameters: [{ type: "payload", payload: "later:1" }],
      },
    ]);
  });

  it("enforces the 24-hour window", () => {
    const now = new Date("2026-10-26T12:00:00Z");
    expect(isWithinServiceWindow({ lastInboundAt: new Date("2026-10-26T00:00:00Z") }, now)).toBe(
      true,
    );
    expect(isWithinServiceWindow({ lastInboundAt: new Date("2026-10-25T11:59:00Z") }, now)).toBe(
      false,
    );
    expect(isWithinServiceWindow({ lastInboundAt: null }, now)).toBe(false);
  });
});

describe("webhook", () => {
  it("accepts only a correct X-Hub-Signature-256", () => {
    const body = Buffer.from('{"entry":[]}');
    const good = `sha256=${createHmac("sha256", "secret").update(body).digest("hex")}`;
    expect(isValidSignature(body, good, "secret")).toBe(true);
    expect(isValidSignature(body, good, "other-secret")).toBe(false);
    expect(isValidSignature(body, "sha256=deadbeef", "secret")).toBe(false);
    expect(isValidSignature(body, undefined, "secret")).toBe(false);
  });

  it("parses text, buttons, lists, voice, location and media", () => {
    expect(parseMessage({ id: "1", from: "91", type: "text", text: { body: "hi" } }).body).toBe(
      "hi",
    );
    expect(
      parseMessage({
        id: "2",
        from: "91",
        type: "interactive",
        interactive: {
          type: "button_reply",
          button_reply: { id: "menu:book", title: "Book a test" },
        },
      }),
    ).toEqual({ type: "interactive", body: "Book a test", payload: { replyId: "menu:book" } });
    expect(
      parseMessage({
        id: "3",
        from: "91",
        type: "interactive",
        interactive: { type: "list_reply", list_reply: { id: "slot:x", title: "7 AM" } },
      }).payload,
    ).toEqual({ replyId: "slot:x" });
    expect(
      parseMessage({
        id: "4",
        from: "91",
        type: "audio",
        audio: { id: "m1", mime_type: "audio/ogg" },
      }),
    ).toMatchObject({
      type: "audio",
      payload: { mediaId: "m1" },
    });
    expect(
      parseMessage({
        id: "5",
        from: "91",
        type: "location",
        location: { latitude: 26.9, longitude: 75.8 },
      }).body,
    ).toContain("26.9");
    expect(parseMessage({ id: "6", from: "91", type: "image" }).type).toBe("image");
  });
});

describe("booking summary and confirm button", () => {
  const payload: DraftPayload = {
    kind: "CATALOG",
    patient: {
      familyMemberId: null,
      name: "Asha",
      gender: "Female",
      dob: "1990-05-15",
      dobApproximate: false,
      relation: "SELF",
    },
    items: [{ type: "PACKAGE", id: "p1", name: "Example Screen Care", price: 799 }],
    symptomNotes: null,
    address: {
      line: "12 MG Road",
      houseNo: "A-4",
      locality: null,
      landmark: null,
      pincode: "302012",
      city: "Jaipur",
      state: "Rajasthan",
      lat: null,
      lng: null,
    },
    date: "2026-10-28",
    slotId: "s1",
    slotTime: "6:00 AM - 8:00 AM",
    quote: { subtotal: 799, homeCollectionCharge: 100, total: 899 },
    fasting: ["10 hours fasting required"],
  };

  it("builds a deterministic summary with the tool-computed total", () => {
    const text = buildSummary(payload);
    expect(text).toContain("Example Screen Care — ₹799");
    expect(text).toContain("*Total: ₹899*");
    expect(text).toContain("Cash on collection");
    expect(buildSummary(payload)).toBe(text);
  });

  it("encodes draft id + summary hash in the Confirm id, and detects a change", () => {
    const draftId = "0b8f2c1e-1111-4222-8333-944455556666";
    const hash = summaryHash(draftId, buildSummary(payload));
    const id = confirmButtonId(draftId, hash);
    expect(id.length).toBeLessThanOrEqual(256);
    expect(parseConfirmButtonId(id)).toEqual({ draftId, hashPrefix: hash.slice(0, 16) });
    const changed = summaryHash(
      draftId,
      buildSummary({ ...payload, quote: { ...payload.quote, total: 10 } }),
    );
    expect(changed.startsWith(hash.slice(0, 16))).toBe(false);
    expect(parseConfirmButtonId("wa_confirm:not-a-uuid:123")).toBeNull();
  });
});

describe("agent guards", () => {
  it("builds history that starts and ends with the customer", () => {
    const msgs = toApiMessages([
      { role: "assistant", text: "template" },
      { role: "user", text: "hi" },
      { role: "user", text: "cbc" },
      { role: "assistant", text: "CBC ₹299" },
      { role: "user", text: "book" },
      { role: "assistant", text: "dangling" },
    ]);
    expect(msgs.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(msgs[0].content).toBe("hi\ncbc");
  });

  it("finds rupee amounts in Hinglish/English text", () => {
    expect(
      extractAmounts("Total ₹1,299 hai, CBC Rs. 299 aur 100 rupees home charge, 50/-"),
    ).toEqual([1299, 299, 100, 50]);
  });

  it("flags a price no tool returned (prompt-injection: '90% discount')", () => {
    const allowed = new Set([799, 899]);
    expect(unsupportedAmounts("Aapke liye sirf ₹90!", allowed, [])).toEqual([90]);
    expect(unsupportedAmounts("Total ₹899", allowed, [])).toEqual([]);
    expect(
      unsupportedAmounts("Woh ₹450 wala", new Set(), [{ role: "assistant", text: "Thyroid ₹450" }]),
    ).toEqual([]);
    // A number the CUSTOMER typed is not an allowed price.
    expect(
      unsupportedAmounts("Haan ₹10 mein", new Set(), [{ role: "user", text: "₹10 mein do" }]),
    ).toEqual([10]);
  });

  it("converts markdown bold to WhatsApp bold", () => {
    expect(toWhatsappText("## Hi\n**Total**")).toBe("Hi\n*Total*");
  });

  it("refuses past dates and dates beyond 30 days", () => {
    const today = todayIst();
    expect(() => assertBookableDate(today)).not.toThrow();
    expect(() => assertBookableDate("2020-01-01")).toThrow(/past/);
    expect(() => assertBookableDate("2099-01-01")).toThrow(/30 days/);
    expect(() => assertBookableDate("tomorrow")).toThrow();
  });

  it("never exposes a phone-number parameter to the model", () => {
    const schema = JSON.stringify(TOOLS.map((t) => t.input_schema));
    expect(schema).not.toMatch(/phone|mobile/i);
  });
});

describe("secrets and signed links", () => {
  it("round-trips AES-GCM and rejects tampering", () => {
    const enc = encryptSecret("EAAG-token");
    expect(enc).not.toContain("EAAG");
    expect(decryptSecret(enc)).toBe("EAAG-token");
    const [v, iv, tag, data] = enc.split(":");
    const tampered = [
      v,
      iv,
      tag,
      Buffer.from("x" + Buffer.from(data, "base64").toString("binary")).toString("base64"),
    ].join(":");
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("signs with a purpose label", () => {
    const sig = signPayload("wa-report", "abc");
    expect(verifySignature("wa-report", "abc", sig)).toBe(true);
    expect(verifySignature("other", "abc", sig)).toBe(false);
  });

  it("report links verify, expire and resist tampering", () => {
    const reportId = "11111111-1111-4111-8111-111111111111";
    const userId = "22222222-2222-4222-8222-222222222222";
    const token = signReportToken(reportId, userId, Date.now() + 60_000);
    expect(verifyReportToken(token)).toEqual({ reportId, appUserId: userId });
    expect(() => verifyReportToken(signReportToken(reportId, userId, Date.now() - 1))).toThrow(
      /expired/,
    );
    expect(() =>
      verifyReportToken(token.replace(userId, "33333333-3333-4333-8333-333333333333")),
    ).toThrow();
  });
});

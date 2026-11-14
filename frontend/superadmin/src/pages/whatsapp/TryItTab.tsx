import { useState } from "react";
import { FlaskConical, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTryWhatsappAssistant } from "@/hooks/queries/useWhatsapp";
import type { ToolRunDto } from "@/services/api/whatsappApi";

interface Turn {
  role: "user" | "assistant";
  text: string;
  tools?: ToolRunDto[];
  note?: string;
}

/** Runs the real assistant with every write simulated: nothing is sent on
 *  WhatsApp, no draft or booking is created. Reads (catalogue, slots, the
 *  pretend number's orders) are real. */
function TryItTab() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const tryIt = useTryWhatsappAssistant();

  function submit() {
    const text = message.trim();
    if (!text) return;
    const history = turns.slice(-12).map((t) => ({ role: t.role, text: t.text.slice(0, 1000) }));
    setTurns((prev) => [...prev, { role: "user", text }]);
    setMessage("");
    tryIt.mutate(
      { message: text, phone: phone.trim() || undefined, history },
      {
        onSuccess: (result) =>
          setTurns((prev) => [
            ...prev,
            {
              role: "assistant",
              text: result.reply ?? `(${result.routedByCode})`,
              tools: result.toolRuns,
              note: result.usage
                ? `in ${result.usage.input} · cached ${result.usage.cacheRead} · out ${result.usage.output} · ~$${result.costUsd.toFixed(5)}`
                : (result.routedByCode ?? undefined),
            },
          ]),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Try-it failed"),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="size-5" /> Try it (dry run)
        </CardTitle>
        <CardDescription>
          Chat with the assistant as a customer. Nothing is sent and nothing is booked — booking
          tools are simulated.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="try-phone">Pretend customer number (optional)</Label>
            <Input
              id="try-phone"
              className="w-56 font-mono"
              placeholder="98xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setTurns([])}>
            <RotateCcw className="size-4" /> New chat
          </Button>
        </div>

        <div className="flex min-h-48 flex-col gap-2 rounded-xl border border-border p-3">
          {turns.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Try: "mujhe bukhar aur kamzori hai, kaunsa test karwana chahiye" or "CBC ka price
              Jaipur 302012".
            </p>
          )}
          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "self-start" : "self-end max-w-[85%]"}>
              <div
                className={
                  t.role === "user"
                    ? "rounded-2xl bg-muted px-3 py-2 text-sm"
                    : "rounded-2xl bg-emerald-500/15 px-3 py-2 text-sm"
                }
              >
                <p className="whitespace-pre-wrap">{t.text}</p>
              </div>
              {t.tools?.map((tool, j) => (
                <pre
                  key={j}
                  className="mt-1 overflow-x-auto rounded-lg bg-muted p-2 text-[11px] whitespace-pre-wrap"
                >
                  <Badge variant={tool.ok ? "secondary" : "destructive"}>{tool.name}</Badge>{" "}
                  {JSON.stringify(tool.input)}
                  {"\n"}→ {tool.result}
                </pre>
              ))}
              {t.note && (
                <p className="mt-0.5 text-right text-[11px] text-muted-foreground">{t.note}</p>
              )}
            </div>
          ))}
          {tryIt.isPending && <p className="self-end text-xs text-muted-foreground">thinking…</p>}
        </div>

        <div className="flex gap-2">
          <Textarea
            rows={2}
            className="resize-none"
            placeholder="Type a customer message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <Button onClick={submit} disabled={tryIt.isPending || !message.trim()} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { TryItTab };

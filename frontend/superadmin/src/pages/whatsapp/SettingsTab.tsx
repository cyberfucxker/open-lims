import { useEffect, useState } from "react";
import { AlertTriangle, Copy, PlugZap, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useRegenerateVerifyToken,
  useSaveWhatsappAccount,
  useTestWhatsappAccount,
  useUpdateWhatsappSettings,
  useWhatsappAccounts,
  useWhatsappSettings,
} from "@/hooks/queries/useWhatsapp";
import { formatRelativeTime } from "@/lib/format";
import type { WhatsappAccountDto } from "@/services/api/whatsappApi";

function copy(value: string, what: string) {
  navigator.clipboard.writeText(value);
  toast.success(`${what} copied.`);
}

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input readOnly value={value} className="font-mono text-xs" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => copy(value, label)}
          aria-label={`Copy ${label}`}
        >
          <Copy className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SecretInput({
  id,
  label,
  saved,
  value,
  onChange,
}: {
  id: string;
  label: string;
  saved: string | null;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        autoComplete="off"
        className="font-mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={saved ? `Saved (${saved}) — leave blank to keep` : "Not set"}
      />
    </div>
  );
}

function AssistantSettings() {
  const { data, isLoading } = useWhatsappSettings();
  const update = useUpdateWhatsappSettings();
  const [form, setForm] = useState({
    enabled: false,
    model: "claude-haiku-5-5",
    maxRepliesPerHour: 20,
    voiceEnabled: true,
    sttProvider: "groq" as "groq" | "openai",
    brandName: "",
    businessInstructions: "",
  });
  const [anthropicKey, setAnthropicKey] = useState("");
  const [sttKey, setSttKey] = useState("");

  useEffect(() => {
    if (data) {
      setForm({
        enabled: data.enabled,
        model: data.model,
        maxRepliesPerHour: data.maxRepliesPerHour,
        voiceEnabled: data.voiceEnabled,
        sttProvider: data.sttProvider,
        brandName: data.brandName,
        businessInstructions: data.businessInstructions,
      });
    }
  }, [data]);

  if (isLoading || !data) return <Skeleton className="h-96 w-full rounded-2xl" />;

  function save() {
    update.mutate(
      {
        ...form,
        ...(anthropicKey.trim() ? { anthropicKey: anthropicKey.trim() } : {}),
        ...(sttKey.trim() ? { sttKey: sttKey.trim() } : {}),
      },
      {
        onSuccess: () => {
          setAnthropicKey("");
          setSttKey("");
          toast.success("Assistant settings saved.");
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assistant</CardTitle>
        <CardDescription>
          The AI that answers on WhatsApp. Keys are stored encrypted and never shown again.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {!data.encryptionKeyConfigured && (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            WHATSAPP_ENCRYPTION_KEY is not set on the server — keys cannot be saved until it is.
          </div>
        )}
        <label className="flex items-center gap-3 text-sm font-medium">
          <Switch
            checked={form.enabled}
            onCheckedChange={(enabled) => setForm({ ...form, enabled })}
          />
          Assistant {form.enabled ? "ON — replies automatically" : "OFF — messages are only stored"}
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SecretInput
            id="wa-anthropic"
            label="Anthropic API key"
            saved={data.anthropicKey}
            value={anthropicKey}
            onChange={setAnthropicKey}
          />
          <div className="flex flex-col gap-1.5">
            <Label>Model</Label>
            <Select value={form.model} onValueChange={(model) => setForm({ ...form, model })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.models.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                    {m === "claude-haiku-5-5" ? " (cheapest, recommended)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wa-brand">Brand name (how the assistant introduces itself)</Label>
            <Input
              id="wa-brand"
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wa-cap">Max AI replies per chat per hour</Label>
            <Input
              id="wa-cap"
              type="number"
              min={1}
              max={200}
              value={form.maxRepliesPerHour}
              onChange={(e) => setForm({ ...form, maxRepliesPerHour: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={form.voiceEnabled}
              onCheckedChange={(voiceEnabled) => setForm({ ...form, voiceEnabled })}
            />{" "}
            Voice notes
          </label>
          <div className="flex flex-col gap-1.5">
            <Label>Speech-to-text</Label>
            <Select
              value={form.sttProvider}
              onValueChange={(v) => setForm({ ...form, sttProvider: v as "groq" | "openai" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groq">Groq — whisper-large-v3-turbo</SelectItem>
                <SelectItem value="openai">OpenAI — whisper-1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SecretInput
            id="wa-stt"
            label="Speech-to-text API key"
            saved={data.sttKey}
            value={sttKey}
            onChange={setSttKey}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wa-instructions">Business instructions (facts only)</Label>
          <Textarea
            id="wa-instructions"
            rows={6}
            value={form.businessInstructions}
            onChange={(e) => setForm({ ...form, businessInstructions: e.target.value })}
            placeholder="Tone, working hours, home-collection policy… The assistant treats this as fact."
          />
        </div>

        <div className="flex justify-end border-t border-border pt-5">
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountForm({
  account,
  onDone,
}: {
  account: WhatsappAccountDto | null;
  onDone: () => void;
}) {
  const save = useSaveWhatsappAccount();
  const [form, setForm] = useState({
    label: account?.label ?? "Main",
    phoneNumberId: account?.phoneNumberId ?? "",
    wabaId: account?.wabaId ?? "",
    displayPhone: account?.displayPhone ?? "",
    isActive: account?.isActive ?? true,
  });
  const [accessToken, setAccessToken] = useState("");
  const [appSecret, setAppSecret] = useState("");

  function submit() {
    save.mutate(
      {
        id: account?.id,
        values: {
          ...form,
          ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
          ...(appSecret.trim() ? { appSecret: appSecret.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success("WhatsApp number saved.");
          onDone();
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
      },
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/30 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="acc-label">Label</Label>
          <Input
            id="acc-label"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="acc-display">Display number</Label>
          <Input
            id="acc-display"
            value={form.displayPhone}
            onChange={(e) => setForm({ ...form, displayPhone: e.target.value })}
            placeholder="+91 98xxxxxxxx"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="acc-pnid">Phone number ID</Label>
          <Input
            id="acc-pnid"
            className="font-mono"
            value={form.phoneNumberId}
            onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="acc-waba">WhatsApp Business Account ID</Label>
          <Input
            id="acc-waba"
            className="font-mono"
            value={form.wabaId}
            onChange={(e) => setForm({ ...form, wabaId: e.target.value })}
          />
        </div>
        <SecretInput
          id="acc-token"
          label="Access token (permanent System User token)"
          saved={account?.accessToken ?? null}
          value={accessToken}
          onChange={setAccessToken}
        />
        <SecretInput
          id="acc-secret"
          label="App secret (for webhook signatures)"
          saved={account?.appSecret ?? null}
          value={appSecret}
          onChange={setAppSecret}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Switch
          checked={form.isActive}
          onCheckedChange={(isActive) => setForm({ ...form, isActive })}
        />{" "}
        Active
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending ? "Saving..." : "Save number"}
        </Button>
      </div>
    </div>
  );
}

function Connection() {
  const { data, isLoading } = useWhatsappAccounts();
  const regenerate = useRegenerateVerifyToken();
  const test = useTestWhatsappAccount();
  const [editing, setEditing] = useState<WhatsappAccountDto | "new" | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>WhatsApp connection</CardTitle>
          <CardDescription>
            In Meta → WhatsApp → Configuration, set the callback URL and verify token below and
            subscribe to the "messages" field.
          </CardDescription>
        </div>
        {!editing && !data?.length && (
          <Button size="sm" onClick={() => setEditing("new")}>
            Connect a number
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {editing && (
          <AccountForm
            account={editing === "new" ? null : editing}
            onDone={() => setEditing(null)}
          />
        )}
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          data?.map((account) => (
            <div
              key={account.id}
              className="flex flex-col gap-3 rounded-xl border border-border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {account.label}{" "}
                    {account.displayPhone && (
                      <span className="text-muted-foreground">· {account.displayPhone}</span>
                    )}
                  </p>
                  <Badge variant={account.isActive ? "success" : "secondary"}>
                    {account.isActive ? "active" : "off"}
                  </Badge>
                  <Badge variant={account.lastWebhookAt ? "info" : "warning"}>
                    {account.lastWebhookAt
                      ? `last webhook ${formatRelativeTime(account.lastWebhookAt)}`
                      : "no webhook received yet"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={test.isPending}
                    onClick={() =>
                      test.mutate(account.id, {
                        onSuccess: (info) =>
                          toast.success(
                            `Connected: ${info.verified_name ?? ""} ${info.display_phone_number ?? ""}`,
                          ),
                        onError: (err) =>
                          toast.error(err instanceof Error ? err.message : "Connection failed"),
                      })
                    }
                  >
                    <PlugZap className="size-4" /> Test
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(account)}>
                    Edit
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CopyField
                  label="Callback URL"
                  value={account.webhookUrl ?? `<PUBLIC_API_BASE_URL>${account.webhookPath}`}
                />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <CopyField label="Verify token" value={account.verifyToken} />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Regenerate verify token"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Regenerate the verify token? You must update it in Meta too.",
                        )
                      )
                        regenerate.mutate(account.id);
                    }}
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                </div>
              </div>
              {!account.webhookUrl && (
                <p className="text-xs text-muted-foreground">
                  Set PUBLIC_API_BASE_URL on the server to show the full callback URL.
                </p>
              )}
              {!account.appSecret && (
                <p className="text-xs text-amber-600">
                  No app secret saved — webhook signatures are NOT being verified.
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SettingsTab() {
  return (
    <div className="flex flex-col gap-4">
      <AssistantSettings />
      <Connection />
    </div>
  );
}

export { SettingsTab };

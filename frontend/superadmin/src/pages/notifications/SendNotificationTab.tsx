import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Search, Syringe, Upload, User, Users, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatNumber } from "@/lib/format";
import type {
  NotificationChannel,
  UserAppNotificationCampaign,
  UserAppNotificationTemplate,
} from "@/lib/types";
import { useCityOptions } from "@/hooks/queries/useOrganizations";
import { fetchAppUsers, type AppUserListRow } from "@/services/api/appUserApi";
import { sendPushCampaignApi, type PushAudience } from "@/services/api/notificationCampaignApi";
import { fetchPhlebotomists, type PhlebotomistDto } from "@/services/api/phlebotomistApi";
import { cn } from "@/utils/cn";

import { ChannelPreview } from "./ChannelPreview";
import {
  categoryLabel,
  channelLabel,
  CHANNEL_ICONS,
  NOTIFICATION_CHANNELS,
} from "./notificationHelpers";
import { SegmentedControl } from "./SegmentedControl";

type AudienceType = "all" | "filtered" | "individual" | "individual_phlebo" | "csv";
type ScheduleType = "now" | "later";
type MessageMode = "template" | "custom";

const ORDER_COUNT_OPTIONS = [
  { value: "any", label: "Any order count" },
  { value: "1", label: "1+ orders" },
  { value: "3", label: "3+ orders" },
  { value: "5", label: "5+ orders" },
  { value: "10", label: "10+ orders" },
];

const AUDIENCE_OPTIONS: {
  value: AudienceType;
  label: string;
  description: string;
  icon: typeof Users;
}[] = [
  { value: "all", label: "All customers", description: "Every registered customer", icon: Users },
  {
    value: "filtered",
    label: "Filtered segment",
    description: "By city / order count",
    icon: Search,
  },
  {
    value: "individual",
    label: "Individual",
    description: "Search a specific customer",
    icon: User,
  },
  {
    value: "individual_phlebo",
    label: "Individual Phlebo",
    description: "Search a specific phlebotomist",
    icon: Syringe,
  },
  { value: "csv", label: "Upload CSV list", description: "Send to an uploaded list", icon: Upload },
];

interface SendNotificationTabProps {
  templates: UserAppNotificationTemplate[];
  onSend: (campaign: UserAppNotificationCampaign) => void;
}

function SendNotificationTab({ templates, onSend }: SendNotificationTabProps) {
  const [audienceType, setAudienceType] = useState<AudienceType>("all");
  const [filterCity, setFilterCity] = useState("all"); // "all" or a real City id
  const [filterOrderCount, setFilterOrderCount] = useState("any");
  const [individualSearchInput, setIndividualSearchInput] = useState("");
  const [individualSearch, setIndividualSearch] = useState(""); // debounced
  const [selectedCustomer, setSelectedCustomer] = useState<AppUserListRow | null>(null);
  const [phleboSearchInput, setPhleboSearchInput] = useState("");
  const [phleboSearch, setPhleboSearch] = useState(""); // debounced
  const [selectedPhlebo, setSelectedPhlebo] = useState<PhlebotomistDto | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRowCount, setCsvRowCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [channel, setChannel] = useState<NotificationChannel>("whatsapp");
  const [messageMode, setMessageMode] = useState<MessageMode>("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");

  const [scheduleType, setScheduleType] = useState<ScheduleType>("now");
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Debounce free-text search so we don't fire a request per keystroke —
  // same pattern as the Customers page.
  useEffect(() => {
    const t = setTimeout(() => setIndividualSearch(individualSearchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [individualSearchInput]);

  useEffect(() => {
    const t = setTimeout(() => setPhleboSearch(phleboSearchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [phleboSearchInput]);

  const cityOptionsQuery = useCityOptions();
  const cityOptions = cityOptionsQuery.data ?? [];

  // Real counts against the live customer base — only the query relevant to
  // the currently-picked audience type actually runs.
  const allCustomersQuery = useQuery({
    queryKey: ["app-users", "audience-count", "all"],
    queryFn: () => fetchAppUsers({ pageSize: 1 }),
    enabled: audienceType === "all",
  });

  const filteredCustomersQuery = useQuery({
    queryKey: ["app-users", "audience-count", "filtered", filterCity, filterOrderCount],
    queryFn: () =>
      fetchAppUsers({
        cityId: filterCity === "all" ? undefined : filterCity,
        minOrderCount: filterOrderCount === "any" ? undefined : Number(filterOrderCount),
        pageSize: 1,
      }),
    enabled: audienceType === "filtered",
  });
  const filteredCount = filteredCustomersQuery.data?.total ?? 0;

  const individualQuery = useQuery({
    queryKey: ["app-users", "audience-search", individualSearch],
    queryFn: () => fetchAppUsers({ search: individualSearch, pageSize: 6 }),
    enabled: audienceType === "individual" && individualSearch.length > 0,
  });
  const individualMatches = individualQuery.data?.rows ?? [];

  const phleboQuery = useQuery({
    queryKey: ["phlebotomists", "audience-search", phleboSearch],
    queryFn: () => fetchPhlebotomists({ search: phleboSearch, pageSize: 6 }),
    enabled: audienceType === "individual_phlebo" && phleboSearch.length > 0,
  });
  const phleboMatches = phleboQuery.data?.rows ?? [];

  const channelTemplates = useMemo(
    () => templates.filter((t) => t.channel === channel && t.approval !== "rejected"),
    [templates, channel],
  );

  const selectedTemplate = useMemo(
    () => channelTemplates.find((t) => t.id === selectedTemplateId) ?? null,
    [channelTemplates, selectedTemplateId],
  );

  const allowsCustomMessage = channel === "push";
  // A phlebotomist is never the audience any of the message Templates were
  // written for (they're all customer-facing — order confirmation, report
  // ready, etc.) — so this audience always writes its own message rather
  // than offering a template picker that would only confuse.
  const forceCustomMessage = audienceType === "individual_phlebo";
  const usingCustomMessage =
    allowsCustomMessage && (messageMode === "custom" || forceCustomMessage);
  const ChannelIcon = CHANNEL_ICONS[channel];
  const previewBody = usingCustomMessage ? customMessage : (selectedTemplate?.body ?? "");

  const audienceCount =
    audienceType === "all"
      ? (allCustomersQuery.data?.total ?? 0)
      : audienceType === "filtered"
        ? filteredCount
        : audienceType === "individual_phlebo"
          ? selectedPhlebo
            ? 1
            : 0
          : audienceType === "individual"
            ? selectedCustomer
              ? 1
              : 0
            : (csvRowCount ?? 0);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setCsvFile(file);
    setCsvRowCount(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const rows = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      setCsvRowCount(Math.max(0, rows.length - 1));
    };
    reader.readAsText(file);
  }

  function resetForm() {
    setSelectedTemplateId(null);
    setCustomMessage("");
    setSelectedCustomer(null);
    setIndividualSearchInput("");
    setIndividualSearch("");
    setSelectedPhlebo(null);
    setPhleboSearchInput("");
    setPhleboSearch("");
    setCsvFile(null);
    setCsvRowCount(null);
    setScheduleType("now");
    setScheduleDateTime("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend() {
    // Only Push is actually wired to a real send right now (see
    // notificationCampaign.service.ts on the backend) — SMS/WhatsApp/Email
    // have no live provider behind them yet, "csv" has no real match-against-
    // customers lookup, and "later" has no job scheduler. Every one of these
    // fails loudly instead of faking a success toast.
    if (channel !== "push") {
      toast.error(
        `${channelLabel(channel)} sending isn't wired to a real provider yet — only Push is live right now.`,
      );
      return;
    }
    if (audienceType === "csv") {
      toast.error("Uploaded-list sending isn't wired to a real match against customers yet.");
      return;
    }
    if (scheduleType === "later") {
      toast.error("Scheduling isn't wired to a real job yet — send now instead.");
      return;
    }
    if (audienceType === "filtered" && filteredCount === 0) {
      toast.error("No customers match this segment.");
      return;
    }
    if (audienceType === "individual" && !selectedCustomer) {
      toast.error("Search and select a customer to notify.");
      return;
    }
    if (audienceType === "individual_phlebo" && !selectedPhlebo) {
      toast.error("Search and select a phlebotomist to notify.");
      return;
    }

    const usingCustom = usingCustomMessage;
    if (usingCustom && !customMessage.trim()) {
      toast.error("Write a message before sending.");
      return;
    }
    if (!usingCustom && !selectedTemplate) {
      toast.error("Select a template for this channel.");
      return;
    }
    if (!usingCustom && selectedTemplate?.approval === "pending") {
      toast.error("This template is still pending approval and cannot be sent yet.");
      return;
    }

    const audience: PushAudience =
      audienceType === "all"
        ? { type: "all" }
        : audienceType === "filtered"
          ? {
              type: "filtered",
              cityId: filterCity === "all" ? undefined : filterCity,
              minOrderCount: filterOrderCount === "any" ? undefined : Number(filterOrderCount),
            }
          : audienceType === "individual_phlebo"
            ? { type: "individual_phlebo", phleboId: (selectedPhlebo as PhlebotomistDto).id }
            : { type: "individual", appUserId: (selectedCustomer as AppUserListRow).id };

    const filterCityName =
      filterCity === "all"
        ? "Any city"
        : (cityOptions.find((c) => c.id === filterCity)?.name ?? "Any city");
    const audienceLabel =
      audienceType === "all"
        ? "All customers"
        : audienceType === "filtered"
          ? `Filtered: ${filterCityName}${filterOrderCount === "any" ? "" : `, ${filterOrderCount}+ orders`}`
          : audienceType === "individual_phlebo"
            ? `Phlebotomist: ${selectedPhlebo?.name ?? selectedPhlebo?.mobile}`
            : `Individual: ${selectedCustomer?.name ?? selectedCustomer?.mobile}`;

    const title = usingCustom
      ? "Example Diagnostics Lab"
      : (selectedTemplate?.name ?? "Example Diagnostics Lab");
    const body = previewBody.trim();

    setIsSending(true);
    try {
      const result = await sendPushCampaignApi({
        audience,
        title,
        body,
        data: { type: "ADMIN_BROADCAST" },
      });

      const campaign: UserAppNotificationCampaign = {
        id: `camp-${Date.now()}`,
        name: usingCustom
          ? customMessage.slice(0, 48) || "Custom Broadcast"
          : (selectedTemplate?.name ?? "Broadcast"),
        templateId: selectedTemplate?.id ?? "custom",
        channel,
        audience: audienceLabel,
        sentAt: new Date().toISOString(),
        stats: {
          sent: result.sent,
          // FCM only confirms "accepted for delivery" — there's no real
          // delivery/read receipt without a provider webhook, so this
          // deliberately doesn't fabricate a delivered/read percentage.
          delivered: result.sent,
          read: 0,
          failed: result.failed + (result.totalMatched - result.withToken),
        },
      };
      onSend(campaign);

      if (result.withToken === 0) {
        toast.error(
          `${formatNumber(result.totalMatched)} recipient(s) matched, but none have a registered device — nothing was sent.`,
        );
      } else if (result.failed > 0) {
        toast.error(
          `Sent to ${result.sent} of ${result.withToken} device(s) — ${result.failed} failed.`,
        );
      } else {
        toast.success(
          `Sent to ${formatNumber(result.sent)} device${result.sent === 1 ? "" : "s"}.`,
        );
      }
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send push campaign.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Audience</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAudienceType(opt.value)}
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    audienceType === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent",
                  )}
                >
                  <opt.icon
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      audienceType === opt.value ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                    <span className="text-[11px] text-muted-foreground">{opt.description}</span>
                  </span>
                </button>
              ))}
            </div>

            {audienceType === "filtered" && (
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-dashed border-border p-3 sm:grid-cols-2">
                <Select value={filterCity} onValueChange={setFilterCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any city</SelectItem>
                    {cityOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterOrderCount} onValueChange={setFilterOrderCount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Order count" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_COUNT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  {filteredCustomersQuery.isLoading ? (
                    "Counting matching customers…"
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">
                        {formatNumber(filteredCount)}
                      </span>{" "}
                      customers match this segment
                    </>
                  )}
                </p>
              </div>
            )}

            {audienceType === "individual" && (
              <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
                {selectedCustomer ? (
                  <div className="flex items-center justify-between rounded-lg bg-accent px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedCustomer.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedCustomer.mobile} · {selectedCustomer.cityName ?? "No city on file"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={individualSearchInput}
                        onChange={(e) => setIndividualSearchInput(e.target.value)}
                        placeholder="Search by name or phone…"
                        className="pl-9"
                      />
                    </div>
                    {individualMatches.length > 0 && (
                      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
                        {individualMatches.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setIndividualSearchInput("");
                            }}
                            className="flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                          >
                            <span className="font-medium text-foreground">
                              {c.name ?? c.mobile}
                            </span>
                            <span className="text-xs text-muted-foreground">{c.mobile}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {individualSearch.length > 0 &&
                      !individualQuery.isLoading &&
                      individualMatches.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No customers match "{individualSearch}".
                        </p>
                      )}
                  </>
                )}
              </div>
            )}

            {audienceType === "individual_phlebo" && (
              <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
                {selectedPhlebo ? (
                  <div className="flex items-center justify-between rounded-lg bg-accent px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedPhlebo.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedPhlebo.mobile} · {selectedPhlebo.cityName ?? "No city on file"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setSelectedPhlebo(null)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={phleboSearchInput}
                        onChange={(e) => setPhleboSearchInput(e.target.value)}
                        placeholder="Search by name or phone…"
                        className="pl-9"
                      />
                    </div>
                    {phleboMatches.length > 0 && (
                      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
                        {phleboMatches.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPhlebo(p);
                              setPhleboSearchInput("");
                            }}
                            className="flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                          >
                            <span className="font-medium text-foreground">{p.name}</span>
                            <span className="text-xs text-muted-foreground">{p.mobile}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {phleboSearch.length > 0 &&
                      !phleboQuery.isLoading &&
                      phleboMatches.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No phlebotomists match "{phleboSearch}".
                        </p>
                      )}
                  </>
                )}
              </div>
            )}

            {audienceType === "csv" && (
              <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {csvFile && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{csvFile.name}</span>
                    {csvRowCount !== null && <> · {formatNumber(csvRowCount)} rows detected</>}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Message</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Channel</Label>
              <SegmentedControl
                ariaLabel="Channel"
                value={channel}
                onChange={(v) => {
                  setChannel(v);
                  setSelectedTemplateId(null);
                }}
                options={NOTIFICATION_CHANNELS.map((c) => ({ value: c, label: channelLabel(c) }))}
              />
            </div>

            {allowsCustomMessage && !forceCustomMessage && (
              <SegmentedControl
                ariaLabel="Message mode"
                value={messageMode}
                onChange={setMessageMode}
                options={[
                  { value: "template", label: "Use a template" },
                  { value: "custom", label: "Custom message" },
                ]}
              />
            )}

            {usingCustomMessage ? (
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
                placeholder="Write a custom push notification message…"
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label>Template</Label>
                <Select
                  value={selectedTemplateId ?? undefined}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select a ${channelLabel(channel)} template`} />
                  </SelectTrigger>
                  <SelectContent>
                    {channelTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} · {categoryLabel(t.category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {channelTemplates.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No usable {channelLabel(channel)} templates yet — create one in the Templates
                    tab.
                  </p>
                )}
                {selectedTemplate?.approval === "pending" && (
                  <p className="text-xs text-warning">
                    This template is pending approval and cannot be sent until approved.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <SegmentedControl
              ariaLabel="Schedule"
              value={scheduleType}
              onChange={setScheduleType}
              options={[
                { value: "now", label: "Send now" },
                { value: "later", label: "Schedule for later" },
              ]}
              className="max-w-xs"
            />
            {scheduleType === "later" && (
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                <Input
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Button size="lg" onClick={handleSend} disabled={isSending} className="w-full sm:w-fit">
          {isSending ? "Sending…" : scheduleType === "now" ? "Send Campaign" : "Schedule Campaign"}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="lg:sticky lg:top-0 flex flex-col gap-3">
          <ChannelPreview
            channel={channel}
            body={previewBody}
            title={selectedTemplate?.name ?? "Open LIMS"}
          />
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            Estimated reach:{" "}
            <span className="font-semibold text-foreground">
              {formatNumber(audienceCount)}
            </span>{" "}
            {audienceType === "individual_phlebo"
              ? audienceCount === 1
                ? "phlebotomist"
                : "phlebotomists"
              : "customers"}
          </div>
          {selectedTemplate && (
            <Badge variant="outline" className="mx-auto flex w-fit items-center gap-1">
              <ChannelIcon className="size-3" />
              Using template: {selectedTemplate.name}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export { SendNotificationTab };

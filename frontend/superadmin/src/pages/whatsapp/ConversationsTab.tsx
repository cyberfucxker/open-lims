import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, CheckCheck, Hand, MessageSquare, Play, Search, Send, UserRound } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useConversation,
  useConversationActions,
  useConversations,
} from "@/hooks/queries/useWhatsapp";
import { formatCurrency, formatDateTime, formatRelativeTime } from "@/lib/format";
import type { ChatMessageDto } from "@/services/api/whatsappApi";
import { cn } from "@/utils/cn";

const AUTHOR_LABEL: Record<ChatMessageDto["author"], string> = {
  CUSTOMER: "Customer",
  AI: "AI",
  STAFF: "Team",
  SYSTEM: "System",
  TEMPLATE: "Template",
};

function MessageBubble({ message }: { message: ChatMessageDto }) {
  const inbound = message.direction === "IN";
  return (
    <div className={cn("flex", inbound ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
          inbound
            ? "rounded-bl-sm bg-muted text-foreground"
            : message.author === "STAFF"
              ? "rounded-br-sm bg-sky-500/15 text-foreground"
              : "rounded-br-sm bg-emerald-500/15 text-foreground",
        )}
      >
        <div className="mb-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {message.author === "AI" ? (
            <Bot className="size-3" />
          ) : message.author === "STAFF" ? (
            <UserRound className="size-3" />
          ) : null}
          <span className="font-medium">{AUTHOR_LABEL[message.author]}</span>
          <span>· {formatDateTime(message.sentAt)}</span>
          {!inbound && <span>· {message.status}</span>}
        </div>
        <p className="break-words whitespace-pre-wrap">{message.body}</p>
        {message.error && <p className="mt-1 text-xs text-destructive">{message.error}</p>}
      </div>
    </div>
  );
}

function ConversationDetail({ id }: { id: string }) {
  const { data, isLoading } = useConversation(id);
  const actions = useConversationActions(id);
  const [draft, setDraft] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [data?.messages.length]);

  if (isLoading || !data) {
    return <Skeleton className="h-[560px] w-full rounded-2xl" />;
  }

  function sendReply() {
    if (!draft.trim()) return;
    actions.reply.mutate(draft.trim(), {
      onSuccess: () => {
        setDraft("");
        toast.success("Sent. The assistant is now paused for this chat.");
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "Could not send"),
    });
  }

  return (
    <Card className="flex h-[640px] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <p className="font-semibold">{data.contactName || data.contactPhone}</p>
          <p className="text-xs text-muted-foreground">
            {data.contactPhone} · {data.account.label}
            {data.appUser && (
              <>
                {" · "}
                <Link className="text-primary underline" to={`/customers/${data.appUser.id}`}>
                  customer profile
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.humanTakeover ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => actions.takeover.mutate(false)}
              disabled={actions.takeover.isPending}
            >
              <Play className="size-4" /> Resume AI
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => actions.takeover.mutate(true)}
              disabled={actions.takeover.isPending}
            >
              <Hand className="size-4" /> Pause AI
            </Button>
          )}
          {data.needsHuman && (
            <Button
              size="sm"
              onClick={() => actions.resolve.mutate()}
              disabled={actions.resolve.isPending}
            >
              <CheckCheck className="size-4" /> Mark handled
            </Button>
          )}
        </div>
      </div>

      {data.needsHuman && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm">
          <span className="font-medium">Handoff — {data.handoffReason}:</span> {data.handoffSummary}
        </div>
      )}
      {data.bookings.some((b) => b.order) && (
        <div className="flex flex-wrap gap-2 border-b border-border px-4 py-2 text-xs">
          {data.bookings
            .filter((b) => b.order)
            .map((b) => (
              <Badge key={b.draftId} variant="success">
                {b.order!.orderNumber} · {b.order!.status} · {formatCurrency(b.order!.totalPayable)}
              </Badge>
            ))}
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {data.messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottom} />
      </div>

      <div className="border-t border-border p-3">
        {data.windowOpen ? (
          <div className="flex gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Reply as a team member — this pauses the AI for this chat"
              rows={2}
              className="resize-none"
            />
            <Button
              onClick={sendReply}
              disabled={actions.reply.isPending || !draft.trim()}
              aria-label="Send"
            >
              <Send className="size-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            The 24-hour window is closed — WhatsApp allows only approved templates until the
            customer writes again.
          </p>
        )}
      </div>
    </Card>
  );
}

function ConversationsTab({ view }: { view: "all" | "handoff" }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const { data, isLoading } = useConversations({ view, search: search || undefined });
  const rows = data?.conversations ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardContent className="flex flex-col gap-3 pt-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isLoading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title={view === "handoff" ? "Nobody is waiting" : "No conversations yet"}
              description={
                view === "handoff"
                  ? "Chats the assistant hands over appear here."
                  : "Messages to your WhatsApp number appear here."
              }
            />
          ) : (
            <div className="flex max-h-[560px] flex-col gap-1 overflow-y-auto">
              {rows.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted",
                    selected === c.id && "bg-muted",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{c.contactName || c.contactPhone}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {c.lastMessageAt ? formatRelativeTime(c.lastMessageAt) : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {c.needsHuman && <Badge variant="warning">handoff</Badge>}
                    {c.humanTakeover && <Badge variant="info">team</Badge>}
                    {c.unreadCount > 0 && <Badge>{c.unreadCount}</Badge>}
                    <span className="truncate text-xs text-muted-foreground">
                      {view === "handoff" ? c.handoffSummary : c.lastMessage?.body}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {selected ? (
        <ConversationDetail id={selected} />
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="Pick a conversation"
          description="Select a chat on the left to read it and reply."
        />
      )}
    </div>
  );
}

export { ConversationsTab };

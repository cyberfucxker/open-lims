import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Inbox, Loader2, RotateCcw, Search } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { useSetSupportTicketStatus, useSupportTickets } from "@/hooks/queries/useSupportTickets";
import type { SupportTicket, SupportTicketStatus } from "@/services/api/supportTicketApi";

import { TicketColumn } from "./TicketColumn";
import { TicketDetailPanel } from "./TicketDetailPanel";

const PAGE_SIZE = 100;

function SupportPage() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error } = useSupportTickets({
    search: search || undefined,
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const tickets = useMemo(() => data?.rows ?? [], [data]);
  const total = data?.total ?? 0;

  const setStatus = useSetSupportTicketStatus();

  const openTickets = useMemo(() => tickets.filter((t) => t.status === "OPEN"), [tickets]);
  const inProgressTickets = useMemo(
    () => tickets.filter((t) => t.status === "IN_PROGRESS"),
    [tickets],
  );
  const closedTickets = useMemo(() => tickets.filter((t) => t.status === "CLOSED"), [tickets]);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null;

  function handleStatusChange(id: string, status: SupportTicketStatus) {
    setStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(`Ticket moved to "${status.replace("_", " ")}"`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to update ticket status."),
      },
    );
  }

  function handleOpenTicket(ticket: SupportTicket) {
    setSelectedTicketId(ticket.id);
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Support / Helpdesk"
        description="Track and resolve customer support tickets raised from the patient app."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Open Tickets"
          value={formatNumber(openTickets.length)}
          icon={Inbox}
          gradient="bg-amber-500"
          index={0}
          alert={openTickets.length > 15}
        />
        <StatCard
          title="In Progress"
          value={formatNumber(inProgressTickets.length)}
          icon={Loader2}
          gradient="bg-sky-500"
          index={1}
        />
        <StatCard
          title="Closed"
          value={formatNumber(closedTickets.length)}
          icon={CheckCircle2}
          gradient="bg-emerald-500"
          index={2}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by customer, subject, or ticket number..."
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">
            <RotateCcw className="size-3.5" /> Reset
          </Button>
          <span className="w-full text-xs text-muted-foreground sm:w-auto">
            Showing {formatNumber(tickets.length)} of {formatNumber(total)} tickets
          </span>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Search}
          title="Couldn't load tickets"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No tickets found"
          description="Try adjusting your search, or check back once patients report issues from the app."
          action={
            search ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <RotateCcw className="size-3.5" /> Clear search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <TicketColumn
            title="Open"
            icon={Inbox}
            accentClass="bg-warning/10 text-warning"
            tickets={openTickets}
            onOpen={handleOpenTicket}
            onStatusChange={handleStatusChange}
          />
          <TicketColumn
            title="In Progress"
            icon={Loader2}
            accentClass="bg-info/10 text-info"
            tickets={inProgressTickets}
            onOpen={handleOpenTicket}
            onStatusChange={handleStatusChange}
          />
          <TicketColumn
            title="Closed"
            icon={CheckCircle2}
            accentClass="bg-success/10 text-success"
            tickets={closedTickets}
            onOpen={handleOpenTicket}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      <TicketDetailPanel
        ticket={selectedTicket}
        open={selectedTicketId !== null}
        onOpenChange={(open) => !open && setSelectedTicketId(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

export { SupportPage };

import { useState } from "react";
import { BellRing } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFollowUps } from "@/hooks/queries/useWhatsapp";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import type { FollowUpStatus } from "@/services/api/whatsappApi";

const STATUS: Record<
  FollowUpStatus,
  { label: string; variant: "secondary" | "success" | "warning" | "destructive" | "info" }
> = {
  SCHEDULED: { label: "Scheduled", variant: "secondary" },
  SENT: { label: "Sent", variant: "info" },
  BOOKED: { label: "Booked again", variant: "success" },
  SKIPPED_REBOOKED: { label: "Already rebooked", variant: "success" },
  SKIPPED: { label: "Skipped", variant: "warning" },
  FAILED: { label: "Failed", variant: "destructive" },
};

const FILTERS: Array<FollowUpStatus | "ALL"> = [
  "ALL",
  "SCHEDULED",
  "SENT",
  "BOOKED",
  "SKIPPED_REBOOKED",
  "SKIPPED",
  "FAILED",
];

/** "Repeat this test" reminders. They are created when a report is ready for
 *  any test/package/parameter that has "Repeat reminder after (days)" set,
 *  and sent between 9 AM and 8 PM IST on the due date. */
function FollowUpsTab() {
  const [filter, setFilter] = useState<FollowUpStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useFollowUps({ status: filter === "ALL" ? undefined : filter, page });
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / 25));
  const counts = data?.counts ?? {};
  const sent = (counts.SENT ?? 0) + (counts.BOOKED ?? 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="size-5" /> Follow-up reminders
        </CardTitle>
        <CardDescription>
          Set "Repeat reminder after (days)" on a test, package or parameter in Tests &amp;
          Packages. When its report is ready, a reminder is scheduled; on the due date the patient
          gets an app notification and a WhatsApp template with Book now / Later. It is skipped if
          they already booked the same test again.
          {sent > 0 &&
            ` Conversion: ${formatNumber(counts.BOOKED ?? 0)} of ${formatNumber(sent)} sent reminders booked again.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
            >
              {f === "ALL" ? "All" : STATUS[f].label}
              {f !== "ALL" && counts[f] ? ` (${formatNumber(counts[f]!)})` : ""}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : !data?.reminders.length ? (
          <EmptyState
            icon={BellRing}
            title="No reminders yet"
            description="Reminders appear here once a report is ready for a test that has a repeat interval set."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Test / package</TableHead>
                  <TableHead>From order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.reminders.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(r.dueDate)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.customer}</div>
                      <div className="text-xs text-muted-foreground">{r.mobile}</div>
                    </TableCell>
                    <TableCell>
                      {r.itemName}
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {r.templateName}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.orderNumber}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS[r.status].variant}>{STATUS[r.status].label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.sentAt ? formatDateTime(r.sentAt) : "—"}
                      {r.sentAt && (
                        <div>
                          app {r.pushSent ? "✓" : "✗"} · WhatsApp {r.whatsappStatus ?? "—"}
                        </div>
                      )}
                      {r.error && <div className="text-destructive">{r.error}</div>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span>
              {page} / {pages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { FollowUpsTab };

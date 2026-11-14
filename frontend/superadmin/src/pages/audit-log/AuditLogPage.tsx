import { useMemo, useState } from "react";
import { Activity, CalendarCheck, RotateCcw, Search, ShieldCheck, UserCog } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber } from "@/lib/format";
import { auditLog } from "@/lib/mock";

import { AuditTimelineItem } from "./AuditTimelineItem";

const PAGE_SIZE = 20;

function mostFrequent(values: string[]): string {
  if (values.length === 0) return "—";
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = values[0];
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

function isSameCalendarDay(iso: string, reference: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}

function AuditLogPage() {
  const sortedLog = useMemo(
    () => [...auditLog].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [],
  );

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actorFilter, setActorFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const moduleOptions = useMemo(
    () => Array.from(new Set(sortedLog.map((e) => e.module))).sort((a, b) => a.localeCompare(b)),
    [sortedLog],
  );
  const actorOptions = useMemo(
    () => Array.from(new Set(sortedLog.map((e) => e.actor))).sort((a, b) => a.localeCompare(b)),
    [sortedLog],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedLog.filter((e) => {
      const matchesSearch =
        !q || e.action.toLowerCase().includes(q) || e.target.toLowerCase().includes(q);
      const matchesModule = moduleFilter === "all" || e.module === moduleFilter;
      const matchesActor = actorFilter === "all" || e.actor === actorFilter;
      const entryTime = new Date(e.at).getTime();
      const matchesFrom = !dateFrom || entryTime >= new Date(dateFrom).getTime();
      const matchesTo = !dateTo || entryTime <= new Date(dateTo).getTime() + 86_400_000 - 1;
      return matchesSearch && matchesModule && matchesActor && matchesFrom && matchesTo;
    });
  }, [sortedLog, search, moduleFilter, actorFilter, dateFrom, dateTo]);

  const visibleEntries = filtered.slice(0, visibleCount);

  const stats = useMemo(() => {
    const now = new Date();
    const totalActions = sortedLog.length;
    const actionsToday = sortedLog.filter((e) => isSameCalendarDay(e.at, now)).length;
    const mostActiveModule = mostFrequent(sortedLog.map((e) => e.module));
    const mostActiveActor = mostFrequent(sortedLog.map((e) => e.actor));
    return { totalActions, actionsToday, mostActiveModule, mostActiveActor };
  }, [sortedLog]);

  function resetFilters() {
    setSearch("");
    setModuleFilter("all");
    setActorFilter("all");
    setDateFrom("");
    setDateTo("");
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Audit Log"
        description="A security and accountability trail of every admin action taken across the panel."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Actions Logged"
          value={formatNumber(stats.totalActions)}
          icon={Activity}
          gradient="bg-primary"
          index={0}
        />
        <StatCard
          title="Actions Today"
          value={formatNumber(stats.actionsToday)}
          icon={CalendarCheck}
          gradient="bg-sky-500"
          index={1}
        />
        <StatCard
          title="Most Active Module"
          value={stats.mostActiveModule}
          icon={ShieldCheck}
          gradient="bg-violet-500"
          index={2}
        />
        <StatCard
          title="Most Active Actor"
          value={stats.mostActiveActor}
          icon={UserCog}
          gradient="bg-emerald-500"
          index={3}
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Search by action or target..."
                className="pl-9"
              />
            </div>
            <Select
              value={moduleFilter}
              onValueChange={(v) => {
                setModuleFilter(v);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              <SelectTrigger className="w-[210px]">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {moduleOptions.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={actorFilter}
              onValueChange={(v) => {
                setActorFilter(v);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Actor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actors</SelectItem>
                {actorOptions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">
              <RotateCcw className="size-3.5" /> Reset
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="audit-date-from" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="audit-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="w-[160px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="audit-date-to" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="audit-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="w-[160px]"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Showing {formatNumber(Math.min(visibleEntries.length, filtered.length))} of{" "}
              {formatNumber(filtered.length)} actions
            </span>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No audit entries found"
          description="Try adjusting your search, module, actor, or date filters."
          action={
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="size-3.5" /> Clear filters
            </Button>
          }
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col">
            {visibleEntries.map((entry, i) => (
              <AuditTimelineItem
                key={entry.id}
                entry={entry}
                isLast={i === visibleEntries.length - 1}
              />
            ))}
          </div>

          {visibleCount < filtered.length && (
            <div className="mt-2 flex justify-center border-t border-border/70 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Load More ({formatNumber(filtered.length - visibleCount)} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { AuditLogPage };

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Database, Download, FolderClock, RotateCcw, Rows3, Search } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime, formatNumber } from "@/lib/format";
import { exportLogs } from "@/lib/mock";
import type { UserAppExportLog } from "@/lib/types";

import { FormatIcon } from "./FormatIcon";

type FormatFilter = "all" | UserAppExportLog["format"];

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

function ExportsPage() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all");

  const moduleOptions = useMemo(
    () => Array.from(new Set(exportLogs.map((e) => e.module))).sort((a, b) => a.localeCompare(b)),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exportLogs.filter((e) => {
      const matchesSearch = !q || e.fileName.toLowerCase().includes(q);
      const matchesModule = moduleFilter === "all" || e.module === moduleFilter;
      const matchesFormat = formatFilter === "all" || e.format === formatFilter;
      return matchesSearch && matchesModule && matchesFormat;
    });
  }, [search, moduleFilter, formatFilter]);

  const stats = useMemo(() => {
    const totalExports = exportLogs.length;
    const exportsThisWeek = exportLogs.filter(
      (e) => Date.now() - new Date(e.requestedAt).getTime() < 7 * 24 * 3600 * 1000,
    ).length;
    const mostActiveModule = mostFrequent(exportLogs.map((e) => e.module));
    const totalRows = exportLogs.reduce((sum, e) => sum + e.rows, 0);
    return { totalExports, exportsThisWeek, mostActiveModule, totalRows };
  }, []);

  function resetFilters() {
    setSearch("");
    setModuleFilter("all");
    setFormatFilter("all");
  }

  function handleDownloadAgain(log: UserAppExportLog) {
    toast.success(`Downloading ${log.fileName}...`);
  }

  const columns: DataTableColumn<UserAppExportLog>[] = [
    {
      key: "module",
      header: "Module",
      render: (row) => <span className="text-sm text-foreground">{row.module}</span>,
    },
    {
      key: "fileName",
      header: "File Name",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <FormatIcon format={row.format} />
          <div className="flex flex-col leading-tight">
            <span className="font-medium text-foreground">{row.fileName}</span>
            <span className="text-xs text-muted-foreground uppercase">{row.format}</span>
          </div>
        </div>
      ),
    },
    {
      key: "requestedBy",
      header: "Requested By",
      render: (row) => <span className="text-sm text-foreground">{row.requestedBy}</span>,
    },
    {
      key: "requestedAt",
      header: "Requested At",
      render: (row) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(row.requestedAt)}</span>
      ),
    },
    {
      key: "rows",
      header: "Row Count",
      render: (row) => <span className="font-medium tabular-nums">{formatNumber(row.rows)}</span>,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-10",
      className: "text-right",
      render: (row) => (
        <Button variant="outline" size="sm" onClick={() => handleDownloadAgain(row)}>
          <Download className="size-3.5" /> Download Again
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Analytics / Export Center"
        description="A central log of every export and download performed across the admin panel."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Exports"
          value={formatNumber(stats.totalExports)}
          icon={Download}
          gradient="bg-primary"
          index={0}
        />
        <StatCard
          title="Exports This Week"
          value={formatNumber(stats.exportsThisWeek)}
          icon={FolderClock}
          gradient="bg-sky-500"
          index={1}
        />
        <StatCard
          title="Most Active Module"
          value={stats.mostActiveModule}
          icon={Database}
          gradient="bg-violet-500"
          index={2}
        />
        <StatCard
          title="Total Rows Exported"
          value={formatNumber(stats.totalRows)}
          icon={Rows3}
          gradient="bg-emerald-500"
          index={3}
        />
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by file name..."
              className="pl-9"
            />
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-[220px]">
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
          <Select value={formatFilter} onValueChange={(v) => setFormatFilter(v as FormatFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              <SelectItem value="xlsx">XLSX</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">
            <RotateCcw className="size-3.5" /> Reset
          </Button>
          <span className="w-full text-xs text-muted-foreground sm:w-auto">
            Showing {formatNumber(filtered.length)} of {formatNumber(exportLogs.length)} exports
          </span>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(row) => row.id}
        pageSize={10}
        emptyTitle="No exports found"
        emptyDescription="Try adjusting your search or filters."
      />
    </div>
  );
}

export { ExportsPage };

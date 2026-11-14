import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, Pencil, Search } from "lucide-react";

import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TestSampleRuleFormDialog } from "@/components/masters/TestSampleRuleFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTestSampleRules } from "@/hooks/queries/useTestSampleRules";
import type { TestSampleRule } from "@/types/master";

function SampleRulesPage() {
  const [search, setSearch] = useState("");
  const [configured, setConfigured] = useState("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editRule, setEditRule] = useState<TestSampleRule | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useTestSampleRules({
    search,
    configured: configured === "all" ? undefined : configured,
    page: pageIndex + 1,
    pageSize,
  });

  const columns = useMemo<ColumnDef<TestSampleRule>[]>(
    () => [
      {
        accessorKey: "testName",
        header: "Test",
        meta: { label: "Test" },
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.testName}</p>
            <p className="text-xs text-muted-foreground">{row.original.testShortName}</p>
          </div>
        ),
      },
      { accessorKey: "sampleType", header: "Sample Type", meta: { label: "Sample Type" } },
      {
        id: "container",
        header: "Container",
        meta: { label: "Container" },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.rule?.containerName ?? "--"}
          </span>
        ),
      },
      {
        id: "fasting",
        header: "Fasting",
        meta: { label: "Fasting" },
        cell: ({ row }) =>
          row.original.rule?.requiresFasting ? (
            <span className="text-sm">{row.original.rule.fastingHours ?? "--"}h</span>
          ) : (
            <span className="text-sm text-muted-foreground">No</span>
          ),
      },
      {
        id: "status",
        header: "Status",
        meta: { label: "Status" },
        cell: ({ row }) => (
          <StatusBadge status={row.original.rule ? "Configured" : "Not Configured"} />
        ),
      },
      {
        id: "actions",
        header: "",
        meta: { label: "Actions" },
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                setEditRule(row.original);
                setFormOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sample Rules"
        description="Map each test to its collection container, fasting/STAT/temperature and volume requirements."
      />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tests…"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIndex(0);
                }}
              />
            </div>
            <Select
              value={configured}
              onValueChange={(v) => {
                setConfigured(v);
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tests</SelectItem>
                <SelectItem value="true">Configured</SelectItem>
                <SelectItem value="false">Not Configured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.rows ?? []}
        isLoading={isLoading || isFetching}
        totalRows={data?.total ?? 0}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={setPageIndex}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
        sorting={[]}
        onSortingChange={() => {}}
        getRowId={(row) => row.testId}
        showColumnVisibility={false}
        emptyState={
          isError ? (
            <EmptyState
              title="Couldn't load sample rules"
              description="Something went wrong while fetching test sample rules. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="No tests found"
              description="Try adjusting your search."
            />
          )
        }
      />

      <TestSampleRuleFormDialog open={formOpen} onOpenChange={setFormOpen} rule={editRule} />
    </div>
  );
}

export { SampleRulesPage };

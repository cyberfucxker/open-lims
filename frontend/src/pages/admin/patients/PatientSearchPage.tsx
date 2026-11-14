import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Download,
  Eye,
  FileSpreadsheet,
  Printer,
  Search,
  SlidersHorizontal,
  UserPlus,
  UserX,
} from "lucide-react";
import { Link } from "react-router-dom";

import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PatientDetailSheet } from "@/components/patients/PatientDetailSheet";
import { PatientFilterPanel } from "@/components/patients/PatientFilterPanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { usePatients } from "@/hooks/queries/usePatients";
import type { Patient, PatientSearchFilters } from "@/types/patient";
import { exportToCsv } from "@/utils/exportCsv";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PatientSearchPage() {
  const [filters, setFilters] = useState<PatientSearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([{ id: "registrationDate", desc: true }]);
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, isFetching, isError, refetch } = usePatients({
    ...filters,
    page: pageIndex + 1,
    pageSize,
    sortBy: sorting[0]?.id,
    sortDir: sorting[0]?.desc ? "desc" : "asc",
  });

  const updateFilters = (next: PatientSearchFilters) => {
    setFilters(next);
    setPageIndex(0);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v && v !== "all");

  const columns = useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        accessorKey: "patientId",
        header: "Patient ID",
        meta: { label: "Patient ID" },
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.patientId}</span>
        ),
      },
      {
        accessorKey: "fullName",
        header: "Patient",
        meta: { label: "Patient" },
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar className="size-8">
              <AvatarFallback className="text-[11px]">
                {initials(row.original.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {row.original.fullName}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.original.gender}, {row.original.age}y
              </p>
            </div>
          </div>
        ),
      },
      { accessorKey: "mobile", header: "Mobile", meta: { label: "Mobile" } },
      { accessorKey: "doctor", header: "Doctor", meta: { label: "Doctor" } },
      {
        accessorKey: "franchise",
        header: "Franchise",
        meta: { label: "Franchise" },
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {String(getValue()).replace("Example Diagnostics Lab — ", "")}
          </span>
        ),
      },
      { accessorKey: "department", header: "Department", meta: { label: "Department" } },
      { accessorKey: "registrationDate", header: "Date", meta: { label: "Date" } },
      {
        accessorKey: "status",
        header: "Status",
        meta: { label: "Status" },
        cell: ({ getValue }) => <StatusBadge status={String(getValue())} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { label: "Actions" },
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setDetailPatient(row.original);
                  setDetailOpen(true);
                }}
              >
                <Eye className="size-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="size-4" /> Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  const handleExport = () => {
    if (!data?.rows.length) return;
    exportToCsv(
      "patients",
      data.rows.map((p) => ({
        "Patient ID": p.patientId,
        Name: p.fullName,
        Gender: p.gender,
        Age: p.age,
        Mobile: p.mobile,
        Doctor: p.doctor,
        Franchise: p.franchise,
        Department: p.department,
        Status: p.status,
        "Registered On": p.registrationDate,
        "Total Amount": p.totalAmount,
      })),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Patient Search"
        description="Find, filter and manage registered patients."
        actions={
          <RippleButton asChild>
            <Link to="/admin/patients/register">
              <UserPlus className="size-4" /> New Patient
            </Link>
          </RippleButton>
        }
      />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID or mobile…"
                className="pl-9"
                value={filters.query ?? ""}
                onChange={(e) => updateFilters({ ...filters, query: e.target.value })}
              />
            </div>
            <Button
              type="button"
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters((prev) => !prev)}
            >
              <SlidersHorizontal className="size-3.5" /> Advanced Search
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="size-3.5" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport}>
                <FileSpreadsheet className="size-4" /> Export as Excel (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="size-4" /> Print current page
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <AnimatePresence>
          {showFilters && (
            <PatientFilterPanel
              filters={filters}
              onChange={updateFilters}
              onReset={() => updateFilters({})}
            />
          )}
        </AnimatePresence>
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
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        showColumnVisibility
        emptyState={
          isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load patients"
              description="Something went wrong while fetching patient records. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={UserX}
              title="No patients found"
              description="Try adjusting your search or filters to find what you're looking for."
              actionLabel={hasActiveFilters ? "Clear filters" : undefined}
              onAction={hasActiveFilters ? () => updateFilters({}) : undefined}
            />
          )
        }
      />

      <PatientDetailSheet patient={detailPatient} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}

export { PatientSearchPage };

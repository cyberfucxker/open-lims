import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Plus, Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { Input } from "@/components/ui/input";
import { usePatientRecords } from "@/hooks/queries/usePatientRecords";
import type { PatientRecord } from "@/types/patientRecord";

function PortalPatientListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading, isFetching, isError, refetch } = usePatientRecords({
    search,
    sortBy: sorting[0]?.id,
    sortDir: sorting[0]?.desc ? "desc" : "asc",
    page: pageIndex + 1,
    pageSize,
  });

  const columns = useMemo<ColumnDef<PatientRecord>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Patient",
        meta: { label: "Patient" },
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.original.patientId}</p>
          </div>
        ),
      },
      {
        accessorKey: "gender",
        header: "Gender / Age",
        meta: { label: "Gender / Age" },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.gender}, {row.original.age}y
          </span>
        ),
      },
      {
        accessorKey: "mobile",
        header: "Mobile",
        meta: { label: "Mobile" },
      },
      {
        accessorKey: "createdAt",
        header: "Registered On",
        meta: { label: "Registered On" },
        cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString("en-IN"),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Patients"
        description="Patients registered by your organization."
        actions={
          <RippleButton onClick={() => navigate("/portal/patients/register")}>
            <Plus className="size-4" /> Register Patient
          </RippleButton>
        }
      />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients…"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageIndex(0);
            }}
          />
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
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        showColumnVisibility={false}
        emptyState={
          isError ? (
            <EmptyState
              title="Couldn't load patients"
              description="Something went wrong while fetching patients. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No patients registered yet"
              description="Register your first patient to get started."
              actionLabel="Register Patient"
              onAction={() => navigate("/portal/patients/register")}
            />
          )
        }
      />
    </div>
  );
}

export { PortalPatientListPage };

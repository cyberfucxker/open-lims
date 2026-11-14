import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  AlertTriangle,
  Download,
  Eye,
  FlaskConical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PackageManagementPanel } from "@/components/packages/PackageManagementPanel";
import { TestDetailSheet } from "@/components/tests/TestDetailSheet";
import { TestForm } from "@/components/tests/TestForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/queries/useCategories";
import { useDepartments } from "@/hooks/queries/useDepartments";
import { useDeleteTest, useTests } from "@/hooks/queries/useTests";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { LabTest } from "@/types/test";
import { exportToCsv } from "@/utils/exportCsv";

function TestListPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [departmentId, setDepartmentId] = useState("all");
  const [status, setStatus] = useState("all");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);

  const [detailTest, setDetailTest] = useState<LabTest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editTest, setEditTest] = useState<LabTest | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading, isFetching, isError, refetch } = useTests({
    search,
    categoryId,
    departmentId,
    status,
    page: pageIndex + 1,
    pageSize,
  });

  const { data: departmentsData } = useDepartments({ active: "true", pageSize: 100 });
  const { data: categoriesData } = useCategories({ active: "true", pageSize: 100 });

  const deleteTest = useDeleteTest();
  const hasActiveFilters =
    !!search || categoryId !== "all" || departmentId !== "all" || status !== "all";

  const resetFilters = () => {
    setSearch("");
    setCategoryId("all");
    setDepartmentId("all");
    setStatus("all");
    setPageIndex(0);
  };

  const columns = useMemo<ColumnDef<LabTest>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Test",
        meta: { label: "Test" },
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.shortName}</p>
          </div>
        ),
      },
      { accessorKey: "department", header: "Department", meta: { label: "Department" } },
      { accessorKey: "category", header: "Category", meta: { label: "Category" } },
      {
        accessorKey: "price",
        header: "Price",
        meta: { label: "Price" },
        cell: ({ getValue }) => (
          <span className="font-medium">₹{Number(getValue()).toLocaleString("en-IN")}</span>
        ),
      },
      { accessorKey: "sampleType", header: "Sample", meta: { label: "Sample" } },
      { accessorKey: "reportTime", header: "Report Time", meta: { label: "Report Time" } },
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
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                setDetailTest(row.original);
                setDetailOpen(true);
              }}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                setEditTest(row.original);
                setEditOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              }
              title={`Delete "${row.original.name}"?`}
              description="This test will be removed from the catalogue. This action cannot be undone."
              confirmLabel="Delete"
              destructive
              onConfirm={async () => {
                try {
                  await deleteTest.mutateAsync(row.original.id);
                  toast.success(`${row.original.name} deleted`);
                } catch (error) {
                  toast.error(
                    error instanceof ApiRequestError
                      ? error.message
                      : "Failed to delete test. Please try again.",
                  );
                  throw error;
                }
              }}
            />
          </div>
        ),
      },
    ],
    [deleteTest],
  );

  const handleExport = () => {
    if (!data?.rows.length) return;
    exportToCsv(
      "tests",
      data.rows.map((t) => ({
        Name: t.name,
        "Short Name": t.shortName,
        Department: t.department,
        Category: t.category,
        Price: t.price,
        "Sample Type": t.sampleType,
        "Report Time": t.reportTime,
        Status: t.status,
      })),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tests / Packages"
        description="Manage the diagnostic test and package catalogue."
      />

      <Tabs defaultValue="tests">
        <TabsList>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <RippleButton asChild>
              <Link to="/admin/tests/add">
                <Plus className="size-4" /> Add Test
              </Link>
            </RippleButton>
          </div>

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
                  value={categoryId}
                  onValueChange={(v) => {
                    setCategoryId(v);
                    setPageIndex(0);
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categoriesData?.rows.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={departmentId}
                  onValueChange={(v) => {
                    setDepartmentId(v);
                    setPageIndex(0);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departmentsData?.rows.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v);
                    setPageIndex(0);
                  }}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="size-3.5" /> Export
              </Button>
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
            emptyState={
              isError ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="Couldn't load tests"
                  description="Something went wrong while fetching the test catalogue. Please try again."
                  actionLabel="Retry"
                  onAction={() => refetch()}
                />
              ) : (
                <EmptyState
                  icon={FlaskConical}
                  title="No tests found"
                  description="Try adjusting your search or filters, or add a new test to the catalogue."
                  actionLabel={hasActiveFilters ? "Clear filters" : undefined}
                  onAction={hasActiveFilters ? resetFilters : undefined}
                />
              )
            }
          />

          <TestDetailSheet test={detailTest} open={detailOpen} onOpenChange={setDetailOpen} />

          <Sheet open={editOpen} onOpenChange={setEditOpen}>
            <SheetContent className="flex flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
              <SheetHeader>
                <SheetTitle>Edit Test</SheetTitle>
              </SheetHeader>
              <div className="px-6 py-5">
                {editTest && (
                  <TestForm
                    mode="edit"
                    test={editTest}
                    onSuccess={() => setEditOpen(false)}
                    onCancel={() => setEditOpen(false)}
                  />
                )}
              </div>
            </SheetContent>
          </Sheet>
        </TabsContent>

        <TabsContent value="packages">
          <PackageManagementPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { TestListPage };

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { AlertTriangle, FileSpreadsheet, FileText, Plus, Receipt, Search } from "lucide-react";
import toast from "react-hot-toast";

import { DataTable } from "@/components/common/DataTable";
import { DatePicker } from "@/components/common/DatePicker";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadBlob } from "@/services/api/billApi";
import { fetchExpensesExcelBlob, fetchExpensesPdfBlob } from "@/services/api/expenseApi";
import {
  useCreateExpense,
  useCreateExpenseCategory,
  useCreateExpenseService,
  useExpenseCategories,
  useExpenseServices,
  useExpenses,
} from "@/hooks/queries/useExpenses";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { ExpenseListItem, ExpensePaymentMode } from "@/types/expense";

const PAYMENT_MODES: ExpensePaymentMode[] = [
  "Cash",
  "Card",
  "UPI",
  "Online",
  "Insurance",
  "Credit",
];

function formatInr(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function QuickAddDialog({
  open,
  onOpenChange,
  title,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSubmit: (name: string) => Promise<void>;
  isPending: boolean;
}) {
  const [name, setName] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setName("");
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <DialogFooter>
          <Button
            disabled={!name.trim() || isPending}
            onClick={async () => {
              await onSubmit(name.trim());
              setName("");
            }}
          >
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddServiceInvoiceForm() {
  const { data: categories } = useExpenseCategories();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const { data: services } = useExpenseServices(categoryId);
  const [serviceId, setServiceId] = useState<string | undefined>();
  const [invoiceDate, setInvoiceDate] = useState<string | undefined>(
    new Date().toISOString().slice(0, 10),
  );
  const [quantity, setQuantity] = useState("1");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<ExpensePaymentMode>("Cash");
  const [remarks, setRemarks] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);

  const createCategory = useCreateExpenseCategory();
  const createService = useCreateExpenseService();
  const createExpense = useCreateExpense();

  const categoryOptions = useMemo(
    () => (categories ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );
  const serviceOptions = useMemo(
    () => (services ?? []).map((s) => ({ value: s.id, label: s.name })),
    [services],
  );

  const applyAutoAmount = (nextQuantity: string, nextRate: string) => {
    const q = Number(nextQuantity);
    const r = Number(nextRate);
    if (q > 0 && r >= 0) {
      setAmount(String(Math.round(q * r * 100) / 100));
    }
  };

  const reset = () => {
    setCategoryId(undefined);
    setServiceId(undefined);
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setQuantity("1");
    setRate("");
    setAmount("");
    setPaymentMode("Cash");
    setRemarks("");
  };

  const handleSave = async () => {
    if (!categoryId || !serviceId || !invoiceDate || !rate || !amount) {
      toast.error("Please fill Category, Service, Invoice Date, Rate and Amount");
      return;
    }
    try {
      await createExpense.mutateAsync({
        categoryId,
        serviceId,
        invoiceDate,
        quantity: Number(quantity) || 1,
        rate: Number(rate),
        amount: Number(amount),
        paymentMode,
        remarks: remarks || undefined,
      });
      toast.success("Service invoice saved");
      reset();
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to save expense");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Service Invoice</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <div className="flex gap-1.5">
            <SearchableSelect
              options={categoryOptions}
              value={categoryId}
              onChange={(v) => {
                setCategoryId(v);
                setServiceId(undefined);
              }}
              placeholder="Select"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setCategoryDialogOpen(true)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Service</label>
          <div className="flex gap-1.5">
            <SearchableSelect
              options={serviceOptions}
              value={serviceId}
              onChange={setServiceId}
              placeholder="Select"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!categoryId}
              onClick={() => setServiceDialogOpen(true)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Invoice Date</label>
          <DatePicker value={invoiceDate} onChange={setInvoiceDate} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Quantity</label>
          <Input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              applyAutoAmount(e.target.value, rate);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Rate</label>
          <Input
            type="number"
            min={0}
            placeholder="Rate"
            value={rate}
            onChange={(e) => {
              setRate(e.target.value);
              applyAutoAmount(quantity, e.target.value);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Amount</label>
          <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Payment Mode</label>
          <Select
            value={paymentMode}
            onValueChange={(v) => setPaymentMode(v as ExpensePaymentMode)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {mode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <label className="text-xs font-medium text-muted-foreground">Remarks</label>
          <Input
            placeholder="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
          <Button variant="outline" onClick={reset} type="button">
            Reset
          </Button>
          <Button onClick={handleSave} disabled={createExpense.isPending}>
            {createExpense.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>

      <QuickAddDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        title="Add Category"
        isPending={createCategory.isPending}
        onSubmit={async (name) => {
          try {
            const category = await createCategory.mutateAsync({ name });
            setCategoryId(category.id);
            setCategoryDialogOpen(false);
            toast.success("Category added");
          } catch (error) {
            toast.error(
              error instanceof ApiRequestError ? error.message : "Failed to add category",
            );
          }
        }}
      />
      <QuickAddDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        title="Add Service"
        isPending={createService.isPending}
        onSubmit={async (name) => {
          if (!categoryId) return;
          try {
            const service = await createService.mutateAsync({ categoryId, name });
            setServiceId(service.id);
            setServiceDialogOpen(false);
            toast.success("Service added");
          } catch (error) {
            toast.error(error instanceof ApiRequestError ? error.message : "Failed to add service");
          }
        }}
      />
    </Card>
  );
}

function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);

  const params = {
    search: search || undefined,
    dateFrom,
    dateTo,
    page: pageIndex + 1,
    pageSize,
  };
  const { data, isLoading, isFetching, isError, refetch } = useExpenses(params);

  const handleExportExcel = async () => {
    try {
      const blob = await fetchExpensesExcelBlob(params);
      downloadBlob(blob, "expenses.xlsx");
    } catch {
      toast.error("Failed to export Excel");
    }
  };

  const handleExportPdf = async () => {
    try {
      const blob = await fetchExpensesPdfBlob(params);
      downloadBlob(blob, "expenses.pdf");
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  const columns = useMemo<ColumnDef<ExpenseListItem>[]>(
    () => [
      {
        accessorKey: "invoiceDate",
        header: "Date",
        meta: { label: "Date" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm">
            {new Date(row.original.invoiceDate).toLocaleDateString("en-IN")}
          </span>
        ),
      },
      {
        accessorKey: "categoryName",
        header: "Category",
        meta: { label: "Category" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.categoryName}</span>
        ),
      },
      {
        accessorKey: "serviceName",
        header: "Particular's",
        meta: { label: "Particular's" },
        enableSorting: false,
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.serviceName}</span>,
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        meta: { label: "Quantity" },
        enableSorting: false,
        cell: ({ row }) => <span className="text-sm">{row.original.quantity}</span>,
      },
      {
        accessorKey: "rate",
        header: "Rate",
        meta: { label: "Rate" },
        enableSorting: false,
        cell: ({ row }) => <span className="text-sm">{formatInr(row.original.rate)}</span>,
      },
      {
        accessorKey: "amount",
        header: "Debit(-)",
        meta: { label: "Debit" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-destructive">
            -{formatInr(row.original.amount)}
          </span>
        ),
      },
      {
        id: "paymentMode",
        header: "Payment Mode",
        meta: { label: "Payment Mode" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.paymentMode}</span>
        ),
      },
      {
        id: "remarks",
        header: "Remarks",
        meta: { label: "Remarks" },
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.remarks ?? "--"}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Expenses" description="Record and track service invoices / expenses." />

      <AddServiceInvoiceForm />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-navy-950">All Service Invoice List</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <FileSpreadsheet className="size-3.5" /> Export to Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
                <FileText className="size-3.5" /> Export to PDF
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search category / service / remarks"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIndex(0);
                }}
              />
            </div>
            <DatePicker
              value={dateFrom}
              onChange={(v) => {
                setDateFrom(v);
                setPageIndex(0);
              }}
              placeholder="Date from"
            />
            <DatePicker
              value={dateTo}
              onChange={(v) => {
                setDateTo(v);
                setPageIndex(0);
              }}
              placeholder="Date to"
            />
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
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(row) => row.id}
        showColumnVisibility={false}
        toolbar={
          data && data.rows.length > 0 ? (
            <span className="text-sm">
              <span className="font-medium text-muted-foreground">Sub Total:&nbsp;</span>
              <span className="font-bold text-navy-950">{formatInr(data.subTotal)}</span>
            </span>
          ) : undefined
        }
        emptyState={
          isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load expenses"
              description="Something went wrong while fetching expenses. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="No expenses recorded yet"
              description="Add a service invoice above to get started."
            />
          )
        }
      />
    </div>
  );
}

export { ExpensesPage };

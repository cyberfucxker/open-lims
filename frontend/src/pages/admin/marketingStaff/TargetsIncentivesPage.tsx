import { useMemo, useState } from "react";
import { Pencil, Percent, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CommissionSlabFormDialog } from "@/components/marketingStaff/CommissionSlabFormDialog";
import { MonthlyTargetGrid } from "@/components/marketingStaff/MonthlyTargetGrid";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import {
  useCommissionSlabs,
  useDeleteCommissionSlab,
  useSetCommissionSlabStatus,
} from "@/hooks/queries/useCommissionSlabs";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { CommissionSlab } from "@/types/commissionSlab";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function currentYearRange() {
  const current = new Date().getFullYear();
  return [current - 2, current - 1, current, current + 1, current + 2];
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
}

function TargetsIncentivesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const years = useMemo(() => currentYearRange(), []);

  const [slabFormOpen, setSlabFormOpen] = useState(false);
  const [editSlab, setEditSlab] = useState<CommissionSlab | null>(null);

  const { data: slabsData, isLoading: slabsLoading, isError: slabsError } = useCommissionSlabs();
  const deleteSlab = useDeleteCommissionSlab();
  const setSlabStatus = useSetCommissionSlabStatus();

  const sortedSlabs = useMemo(
    () => (slabsData ? [...slabsData.rows].sort((a, b) => a.fromAmount - b.fromAmount) : []),
    [slabsData],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Targets & Incentives"
        description="Set monthly targets for marketing staff and configure commission slabs."
      />

      <Tabs defaultValue="targets">
        <TabsList>
          <TabsTrigger value="targets">Monthly Targets</TabsTrigger>
          <TabsTrigger value="slabs">Commission Slabs</TabsTrigger>
        </TabsList>

        <TabsContent value="targets" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <MonthlyTargetGrid month={month} year={year} />
        </TabsContent>

        <TabsContent value="slabs" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <RippleButton
              onClick={() => {
                setEditSlab(null);
                setSlabFormOpen(true);
              }}
            >
              <Plus className="size-4" /> Add Slab
            </RippleButton>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From Amount</TableHead>
                  <TableHead>To Amount</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slabsLoading ? (
                  <TableSkeleton columns={5} rows={5} />
                ) : slabsError ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState
                        title="Couldn't load commission slabs"
                        description="Something went wrong while fetching commission slabs. Please try again."
                      />
                    </TableCell>
                  </TableRow>
                ) : sortedSlabs.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState
                        icon={Percent}
                        title="No commission slabs configured"
                        description="Add a commission slab to define incentive percentages by revenue band."
                        actionLabel="Add Slab"
                        onAction={() => {
                          setEditSlab(null);
                          setSlabFormOpen(true);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedSlabs.map((slab) => (
                    <TableRow key={slab.id}>
                      <TableCell className="text-sm font-medium text-foreground">
                        {formatAmount(slab.fromAmount)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {slab.toAmount === null ? "No limit" : formatAmount(slab.toAmount)}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{slab.percentage}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={slab.active}
                            onCheckedChange={(checked) =>
                              setSlabStatus.mutate(
                                { id: slab.id, active: checked },
                                {
                                  onError: (error) =>
                                    toast.error(
                                      error instanceof ApiRequestError
                                        ? error.message
                                        : "Failed to update status",
                                    ),
                                },
                              )
                            }
                          />
                          <StatusBadge status={slab.active ? "Active" : "Inactive"} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => {
                              setEditSlab(slab);
                              setSlabFormOpen(true);
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
                            title="Delete this commission slab?"
                            description="This commission slab will be permanently deleted. This action cannot be undone."
                            confirmLabel="Delete"
                            destructive
                            onConfirm={async () => {
                              try {
                                await deleteSlab.mutateAsync(slab.id);
                                toast.success("Commission slab deleted");
                              } catch (error) {
                                toast.error(
                                  error instanceof ApiRequestError
                                    ? error.message
                                    : "Failed to delete commission slab",
                                );
                                throw error;
                              }
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <CommissionSlabFormDialog
        open={slabFormOpen}
        onOpenChange={setSlabFormOpen}
        slab={editSlab}
      />
    </div>
  );
}

export { TargetsIncentivesPage };

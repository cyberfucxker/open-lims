import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Target } from "lucide-react";
import toast from "react-hot-toast";

import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMonthlyTargets, useUpsertMonthlyTarget } from "@/hooks/queries/useMonthlyTargets";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type { MarketingStaff } from "@/types/marketingStaff";

/** The dedicated staff-picker hook/types (`useMarketingStaff.ts` / `types/marketingStaff.ts`)
 *  are owned by a parallel agent and don't expose the lightweight "/active" list endpoint
 *  yet, so this fetches it directly — matches the same response-unwrapping pattern as
 *  `fetchActiveReferralDoctors` in `referralDoctor.api.ts`. */
async function fetchActiveMarketingStaff(): Promise<MarketingStaff[]> {
  const response =
    await httpClient.get<ApiResponseBody<MarketingStaff[]>>("/marketing-staff/active");
  return response.data.data as MarketingStaff[];
}

interface MonthlyTargetGridProps {
  month: number;
  year: number;
}

interface RowValues {
  revenueTarget: string;
  doctorTarget: string;
  patientTarget: string;
}

function MonthlyTargetGrid({ month, year }: MonthlyTargetGridProps) {
  const {
    data: staffList,
    isLoading: staffLoading,
    isError: staffError,
  } = useQuery({
    queryKey: ["marketingStaff", "active"],
    queryFn: fetchActiveMarketingStaff,
  });

  const {
    data: targetsData,
    isLoading: targetsLoading,
    isError: targetsError,
  } = useMonthlyTargets({ month, year });

  const upsertTarget = useUpsertMonthlyTarget();
  const [rows, setRows] = useState<Record<string, RowValues>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const initializedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!staffList || !targetsData) return;
    const key = `${month}-${year}`;
    if (initializedKey.current === key) return;

    const existingByStaffId = new Map(targetsData.rows.map((t) => [t.marketingStaffId, t]));
    const next: Record<string, RowValues> = {};
    for (const staff of staffList) {
      const existing = existingByStaffId.get(staff.id);
      next[staff.id] = {
        revenueTarget: existing ? String(existing.revenueTarget) : "",
        doctorTarget: existing ? String(existing.doctorTarget) : "",
        patientTarget: existing ? String(existing.patientTarget) : "",
      };
    }
    setRows(next);
    initializedKey.current = key;
  }, [staffList, targetsData, month, year]);

  const handleFieldChange = (staffId: string, field: keyof RowValues, value: string) => {
    setRows((prev) => ({
      ...prev,
      [staffId]: { ...prev[staffId], [field]: value },
    }));
  };

  const handleSave = async (staff: MarketingStaff) => {
    const row = rows[staff.id];
    if (!row) return;
    setSavingId(staff.id);
    try {
      await upsertTarget.mutateAsync({
        marketingStaffId: staff.id,
        month,
        year,
        revenueTarget: Number(row.revenueTarget) || 0,
        doctorTarget: Number(row.doctorTarget) || 0,
        patientTarget: Number(row.patientTarget) || 0,
      });
      toast.success(`Target saved for ${staff.name}`);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to save target");
    } finally {
      setSavingId(null);
    }
  };

  const isLoading = staffLoading || targetsLoading;
  const isError = staffError || targetsError;

  const sortedStaff = useMemo(
    () => (staffList ? [...staffList].sort((a, b) => a.name.localeCompare(b.name)) : []),
    [staffList],
  );

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Staff</TableHead>
            <TableHead>Employee Code</TableHead>
            <TableHead>Revenue Target</TableHead>
            <TableHead>Doctor Target</TableHead>
            <TableHead>Patient Target</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton columns={6} rows={6} />
          ) : isError ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="p-0">
                <EmptyState
                  title="Couldn't load monthly targets"
                  description="Something went wrong while fetching data. Please try again."
                />
              </TableCell>
            </TableRow>
          ) : sortedStaff.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="p-0">
                <EmptyState
                  icon={Target}
                  title="No active marketing staff"
                  description="Add active marketing staff members to set monthly targets for them."
                />
              </TableCell>
            </TableRow>
          ) : (
            sortedStaff.map((staff) => {
              const row = rows[staff.id] ?? {
                revenueTarget: "",
                doctorTarget: "",
                patientTarget: "",
              };
              const isSaving = savingId === staff.id;
              return (
                <TableRow key={staff.id}>
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">{staff.name}</p>
                    {staff.designation && (
                      <p className="text-xs text-muted-foreground">{staff.designation}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {staff.employeeCode}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="h-9 w-32"
                      value={row.revenueTarget}
                      onChange={(e) => handleFieldChange(staff.id, "revenueTarget", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      className="h-9 w-28"
                      value={row.doctorTarget}
                      onChange={(e) => handleFieldChange(staff.id, "doctorTarget", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      className="h-9 w-28"
                      value={row.patientTarget}
                      onChange={(e) => handleFieldChange(staff.id, "patientTarget", e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" disabled={isSaving} onClick={() => handleSave(staff)}>
                      {isSaving && <Loader2 className="size-3.5 animate-spin" />}
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export { MonthlyTargetGrid };

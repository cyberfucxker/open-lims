import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  CalendarClock,
  FileSpreadsheet,
  Stethoscope,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import { ChartCard } from "@/components/common/ChartCard";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatCardSkeleton } from "@/components/common/StatCardSkeleton";
import { LeaderboardCard } from "@/components/marketingStaff/LeaderboardCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDashboardSummary, useMonthlyReport } from "@/hooks/queries/useMarketingReport";
import { fetchMonthlyReportExcelBlob } from "@/services/api/marketingReport.api";
import { downloadBlob } from "@/services/api/billApi";
import { ApiRequestError } from "@/services/api/ApiRequestError";

const MONTH_OPTIONS = [
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

function formatInr(value: number) {
  return `₹${Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;
}

function formatPercent(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function MonthlyReportPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [isExporting, setIsExporting] = useState(false);

  const yearOptions = useMemo(
    () => [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2],
    [currentYear],
  );

  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary();
  const { data: report, isLoading: isReportLoading } = useMonthlyReport(month, year);

  const rows = report?.rows ?? [];
  const totals = report?.totals;

  const chartData = rows.map((row) => ({
    name: row.employeeCode,
    achievementPercent: row.achievementPercent ?? 0,
  }));

  const revenueTrend =
    summary?.overallAchievementPercent !== null && summary?.overallAchievementPercent !== undefined
      ? summary.overallAchievementPercent - 100
      : undefined;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await fetchMonthlyReportExcelBlob(month, year);
      downloadBlob(blob, `marketing-report-${month}-${year}.xlsx`);
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : "Failed to export monthly report";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Monthly Report"
        description="Track marketing staff performance against targets."
        actions={
          <Button variant="outline" disabled={isExporting} onClick={handleExport}>
            <FileSpreadsheet className="size-4" />
            {isExporting ? "Exporting…" : "Export Excel"}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {isSummaryLoading || !summary
          ? Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
          : [
              {
                label: "Active Staff",
                value: summary.activeStaffCount,
                icon: Users,
                color: "bg-blue-500",
              },
              {
                label: "Active Doctors",
                value: summary.activeDoctorCount,
                icon: Stethoscope,
                color: "bg-indigo-500",
              },
              {
                label: "Revenue Achieved",
                value: summary.revenueAchieved,
                trend: revenueTrend,
                icon: TrendingUp,
                prefix: "₹",
                color: "bg-emerald-500",
              },
              {
                label: "Overall Achievement",
                value: summary.overallAchievementPercent ?? 0,
                suffix: "%",
                icon: Target,
                color: "bg-amber-500",
              },
              {
                label: "Upcoming Visits (7 days)",
                value: summary.upcomingVisitsCount,
                icon: CalendarClock,
                color: "bg-sky-500",
              },
            ].map((card, i) => <StatCard key={card.label} index={i} {...card} />)}
      </div>

      <ChartCard
        title="Achievement % by Staff"
        description={`${MONTH_OPTIONS.find((m) => m.value === month)?.label ?? ""} ${year}`}
      >
        {isReportLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : chartData.length === 0 ? (
          <EmptyState title="No data" description="No staff performance recorded for this month." />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: "var(--chart-axis)" }}
                  tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
                  width={40}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  cursor={{ fill: "var(--accent)" }}
                  content={({ active, label, payload }) => (
                    <ChartTooltip
                      active={active}
                      label={label ? String(label) : undefined}
                      payload={payload?.map((p) => ({
                        name: "Achievement",
                        value: Number(p.value),
                        color: "var(--chart-1)",
                      }))}
                      formatValue={(value) => `${value.toFixed(1)}%`}
                    />
                  )}
                />
                <Bar
                  dataKey="achievementPercent"
                  name="Achievement"
                  fill="var(--chart-1)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Code</TableHead>
                <TableHead>Staff Name</TableHead>
                <TableHead className="text-right">Revenue Target</TableHead>
                <TableHead className="text-right">Revenue Achieved</TableHead>
                <TableHead className="text-right">Doctor Target</TableHead>
                <TableHead className="text-right">Doctors Achieved</TableHead>
                <TableHead className="text-right">Patient Target</TableHead>
                <TableHead className="text-right">Patients Achieved</TableHead>
                <TableHead className="text-right">Achievement %</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isReportLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="p-0">
                    <div className="flex flex-col gap-2 p-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full" />
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={10} className="p-0">
                    <EmptyState
                      title="No staff data"
                      description="No marketing staff records found for the selected month."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.marketingStaffId}>
                    <TableCell>{row.employeeCode}</TableCell>
                    <TableCell className="font-medium text-navy-950">{row.staffName}</TableCell>
                    <TableCell className="text-right">{formatInr(row.revenueTarget)}</TableCell>
                    <TableCell className="text-right">{formatInr(row.revenueAchieved)}</TableCell>
                    <TableCell className="text-right">{row.doctorTarget}</TableCell>
                    <TableCell className="text-right">{row.doctorsAchieved}</TableCell>
                    <TableCell className="text-right">{row.patientTarget}</TableCell>
                    <TableCell className="text-right">{row.patientsAchieved}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent(row.achievementPercent)}
                    </TableCell>
                    <TableCell className="text-right">{formatInr(row.commissionAmount)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {!isReportLoading && rows.length > 0 && totals && (
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">{formatInr(totals.revenueTarget)}</TableCell>
                  <TableCell className="text-right">{formatInr(totals.revenueAchieved)}</TableCell>
                  <TableCell className="text-right">{totals.doctorTarget}</TableCell>
                  <TableCell className="text-right">{totals.doctorsAchieved}</TableCell>
                  <TableCell className="text-right">{totals.patientTarget}</TableCell>
                  <TableCell className="text-right">{totals.patientsAchieved}</TableCell>
                  <TableCell className="text-right">
                    {formatPercent(totals.overallAchievementPercent)}
                  </TableCell>
                  <TableCell className="text-right">{formatInr(totals.commissionAmount)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>

        <LeaderboardCard month={month} year={year} />
      </div>
    </div>
  );
}

export { MonthlyReportPage };

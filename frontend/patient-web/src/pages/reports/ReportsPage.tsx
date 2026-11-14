import { useMemo, useState } from "react";
import { CheckCircle2, FileText, FlaskConical, Lock, SearchX, ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHero, PageHeroChip } from "@/components/common/PageHero";
import { StatTiles, type StatTile } from "@/components/common/StatTiles";
import { SearchBar } from "@/components/catalog/SearchBar";
import { LinkedAccountBar } from "@/components/reports/LinkedAccountBar";
import { ReportCardSkeletonList } from "@/components/reports/ReportCardSkeleton";
import { ThirdPartyLinkCard } from "@/components/reports/ThirdPartyLinkCard";
import { ThirdPartyReportRow } from "@/components/reports/ThirdPartyReportRow";
import { getReportStatus } from "@/components/reports/reportStatus";
import {
  useDownloadThirdPartyReport,
  usePayThirdPartyBalance,
  useThirdPartyReports,
} from "@/hooks/queries/useThirdPartyReports";
import { useThirdPartyLabStore } from "@/store/thirdPartyLabStore";
import type { ThirdPartyReportItem } from "@/types";

/** Counts by display state, derived from the list already fetched — no extra request. */
function buildTiles(reports: ThirdPartyReportItem[]): StatTile[] {
  let ready = 0;
  let due = 0;
  let processing = 0;

  for (const report of reports) {
    const status = getReportStatus(report);
    if (status === "READY") ready += 1;
    else if (status === "PAYMENT_DUE") due += 1;
    else processing += 1;
  }

  return [
    {
      label: "Ready",
      value: String(ready),
      icon: CheckCircle2,
      iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Payment due",
      value: String(due),
      icon: Lock,
      iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Processing",
      value: String(processing),
      icon: FlaskConical,
      iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
  ];
}

function matchesQuery(report: ThirdPartyReportItem, query: string): boolean {
  return (
    report.patientName.toLowerCase().includes(query) ||
    report.labCode.toLowerCase().includes(query) ||
    String(report.testRegnId).includes(query)
  );
}

/** The lab partner (third-party) OTP-link + fetch flow IS the
 *  report-viewing flow for this app — not a second/alternate source, so
 *  it renders directly here rather than behind a tab. */
function ReportsPage() {
  const userFID = useThirdPartyLabStore((s) => s.userFID);
  const { data, isLoading } = useThirdPartyReports();
  const payMutation = usePayThirdPartyBalance();
  const downloadMutation = useDownloadThirdPartyReport();

  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();

  const visible = useMemo(() => {
    const list = data ?? [];
    return query ? list.filter((report) => matchesQuery(report, query)) : list;
  }, [data, query]);

  const reports = data ?? [];
  const isLinked = Boolean(userFID);

  const renderReports = () => {
    if (isLoading) return <ReportCardSkeletonList count={3} />;

    if (reports.length === 0) {
      return (
        <EmptyState
          icon={FileText}
          title="No reports found"
          description="We couldn't find any reports for this mobile number."
        />
      );
    }

    if (visible.length === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title={`No reports match “${search.trim()}”`}
          description="Try a patient name, lab code or registration number."
          actionLabel="Clear search"
          onAction={() => setSearch("")}
        />
      );
    }

    return (
      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        {visible.map((report, i) => (
          <ThirdPartyReportRow
            key={report.testRegnId}
            report={report}
            index={i}
            onPay={(r) => payMutation.mutate(r)}
            isPaying={
              payMutation.isPending && payMutation.variables?.testRegnId === report.testRegnId
            }
            onDownload={(r) => downloadMutation.mutate(r)}
            isDownloading={
              downloadMutation.isPending &&
              downloadMutation.variables?.testRegnId === report.testRegnId
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="pb-10">
      <PageHero
        eyebrow={
          <PageHeroChip icon={<ShieldCheck className="size-3.5" />}>
            Digitally verified lab reports
          </PageHeroChip>
        }
        title="My Reports"
        description={
          isLinked
            ? "Every report filed against your mobile number at our partner lab, in one place."
            : "Verify your mobile number once to unlock every report filed against it."
        }
      >
        {isLinked && <StatTiles tiles={buildTiles(reports)} isLoading={isLoading} />}
      </PageHero>

      <div className="mx-auto max-w-5xl space-y-4 px-4 pt-5">
        {!isLinked ? (
          <ThirdPartyLinkCard />
        ) : (
          <>
            <LinkedAccountBar />

            {reports.length > 0 && (
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by patient, lab code or reg. no…"
                aria-label="Search reports"
                className="h-11 rounded-xl"
                containerClassName="sm:max-w-sm"
              />
            )}

            {renderReports()}
          </>
        )}
      </div>
    </div>
  );
}

export { ReportsPage };

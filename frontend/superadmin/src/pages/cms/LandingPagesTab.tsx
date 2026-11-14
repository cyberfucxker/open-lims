import { useState } from "react";
import { Copy, ExternalLink, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/format";
import {
  useDeleteLandingPage,
  useLandingPages,
  useSetLandingPageStatus,
} from "@/hooks/queries/useLandingPages";
import {
  landingPageUrl,
  type LandingPageDto,
  type LandingPageState,
} from "@/services/api/landingPageApi";

import { LandingPageFormDialog } from "./LandingPageFormDialog";

const STATE: Record<
  LandingPageState,
  { label: string; variant: "success" | "info" | "secondary" | "outline" }
> = {
  LIVE: { label: "Live", variant: "success" },
  UPCOMING: { label: "Upcoming", variant: "info" },
  EXPIRED: { label: "Expired", variant: "secondary" },
  OFF: { label: "Off", variant: "outline" },
};

function LandingPagesTab() {
  const { data, isLoading, isError, error } = useLandingPages();
  const setStatus = useSetLandingPageStatus();
  const remove = useDeleteLandingPage();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LandingPageDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LandingPageDto | null>(null);
  const pages = data ?? [];

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  const columns: DataTableColumn<LandingPageDto>[] = [
    {
      key: "name",
      header: "Landing page",
      render: (p) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{p.name}</span>
          <span className="text-xs text-muted-foreground">{p.title}</span>
        </div>
      ),
    },
    {
      key: "link",
      header: "Link",
      render: (p) => (
        <div className="flex items-center gap-1">
          <span className="max-w-56 truncate font-mono text-xs text-muted-foreground">
            /offer/{p.slug}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Copy link"
            onClick={() => {
              navigator.clipboard.writeText(landingPageUrl(p.slug));
              toast.success("Link copied.");
            }}
          >
            <Copy className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="Open">
            <a href={landingPageUrl(p.slug)} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      ),
    },
    { key: "city", header: "City", render: (p) => <span className="text-sm">{p.city.name}</span> },
    {
      key: "packages",
      header: "Packages",
      render: (p) => (
        <span className="text-xs text-muted-foreground">
          {p.packages.length}
          {p.packages.some((x) => !x.available) && (
            <span className="ml-1 text-destructive">(some inactive)</span>
          )}
        </span>
      ),
    },
    {
      key: "validity",
      header: "Validity",
      render: (p) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDate(p.validFrom)} – {formatDate(p.validTo)}
        </span>
      ),
    },
    {
      key: "state",
      header: "Status",
      render: (p) => <Badge variant={STATE[p.state].variant}>{STATE[p.state].label}</Badge>,
    },
    {
      key: "active",
      header: "Active",
      render: (p) => (
        <Switch
          checked={p.isActive}
          onCheckedChange={(isActive) =>
            setStatus.mutate(
              { id: p.id, isActive },
              {
                onError: (err) =>
                  toast.error(err instanceof Error ? err.message : "Failed to update."),
              },
            )
          }
        />
      ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-24",
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditing(p);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteTarget(p)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <p className="text-sm text-muted-foreground">
            Landing pages for ad campaigns — share the link in your ads. Visitors can add packages
            to the cart straight from the page.
          </p>
          <Button onClick={openNew}>
            <Plus className="size-4" />
            New landing page
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Megaphone}
          title="Couldn't load landing pages"
          description={error instanceof Error ? error.message : "Something went wrong."}
        />
      ) : pages.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No landing pages yet"
          description="Create one for your next ad campaign."
          action={
            <Button onClick={openNew} variant="outline" size="sm">
              <Plus className="size-3.5" />
              New landing page
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={pages} rowKey={(p) => p.id} pageSize={10} />
      )}

      <LandingPageFormDialog open={formOpen} onOpenChange={setFormOpen} page={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete landing page?"
        description={`"${deleteTarget?.name ?? ""}" will be removed and its link will show "offer not found". Turn it off instead if ads may still point to it.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (!deleteTarget) return;
          remove.mutate(deleteTarget.id, {
            onSuccess: () => toast.success("Landing page deleted."),
            onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete."),
          });
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

export { LandingPagesTab };

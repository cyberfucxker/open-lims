import { useState } from "react";
import { AlertTriangle, Package as PackageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { RippleButton } from "@/components/common/RippleButton";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { PackageForm } from "@/components/packages/PackageForm";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeletePackage, usePackages } from "@/hooks/queries/usePackages";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { LabPackage } from "@/types/package";

function PackageManagementPanel() {
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editPackage, setEditPackage] = useState<LabPackage | null>(null);

  const { data, isLoading, isError, refetch } = usePackages({ pageSize: 100 });
  const deletePackage = useDeletePackage();

  const packages = data?.rows ?? [];

  if (view !== "list") {
    return (
      <PackageForm
        mode={view}
        pkg={editPackage ?? undefined}
        onSuccess={() => {
          setView("list");
          setEditPackage(null);
        }}
        onCancel={() => {
          setView("list");
          setEditPackage(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <RippleButton
          onClick={() => {
            setEditPackage(null);
            setView("create");
          }}
        >
          <Plus className="size-4" /> Add New Package
        </RippleButton>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Tests</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={4} rows={5} />
            ) : isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="p-0">
                  <EmptyState
                    icon={AlertTriangle}
                    title="Couldn't load packages"
                    description="Something went wrong while fetching packages. Please try again."
                    actionLabel="Retry"
                    onAction={() => refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : packages.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="p-0">
                  <EmptyState
                    icon={PackageIcon}
                    title="No packages yet"
                    description="Add a package to bundle multiple tests together at a flat price."
                    actionLabel="Add New Package"
                    onAction={() => {
                      setEditPackage(null);
                      setView("create");
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : (
              packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="text-sm font-medium text-foreground">{pkg.name}</TableCell>
                  <TableCell className="text-sm text-foreground">
                    {pkg.price.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{pkg.testCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => {
                          setEditPackage(pkg);
                          setView("edit");
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
                        title={`Delete "${pkg.name}"?`}
                        description="This package will be removed from the catalogue. This action cannot be undone."
                        confirmLabel="Delete"
                        destructive
                        onConfirm={async () => {
                          try {
                            await deletePackage.mutateAsync(pkg.id);
                            toast.success(`${pkg.name} deleted`);
                          } catch (error) {
                            toast.error(
                              error instanceof ApiRequestError
                                ? error.message
                                : "Failed to delete package. Please try again.",
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
    </div>
  );
}

export { PackageManagementPanel };

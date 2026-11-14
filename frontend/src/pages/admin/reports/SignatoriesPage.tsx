import { useRef, useState } from "react";
import { FileText, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { RippleButton } from "@/components/common/RippleButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateSignatory,
  useDeleteSignatory,
  useSignatories,
  useUpdateSignatory,
  useUploadSignatoryImage,
} from "@/hooks/queries/useSignatories";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { Signatory, SignatoryFormValues } from "@/types/signatory";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/api\/v1\/?$/, "");

const EMPTY_DRAFT: SignatoryFormValues = { name: "", title: "", passkey: "" };

function SignatureUpload({ signatory }: { signatory: Signatory }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadSignatoryImage();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadImage.mutateAsync({ id: signatory.id, file });
      toast.success("Signature image uploaded");
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to upload image");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      {signatory.signaturePath ? (
        <img
          src={`${API_ORIGIN}${signatory.signaturePath}`}
          alt={signatory.name}
          className="h-8 w-16 rounded border border-border bg-white object-contain p-0.5"
        />
      ) : (
        <div className="flex h-8 w-16 items-center justify-center rounded border border-dashed border-border text-muted-foreground">
          <ImagePlus className="size-3.5" />
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadImage.isPending}
      >
        {uploadImage.isPending ? <Loader2 className="size-3 animate-spin" /> : null}
        {signatory.signaturePath ? "Replace" : "Upload"}
      </Button>
    </div>
  );
}

function SignatoriesPage() {
  const { data, isLoading, isError, refetch } = useSignatories({ pageSize: 100 });
  const createSignatory = useCreateSignatory();
  const updateSignatory = useUpdateSignatory();
  const deleteSignatory = useDeleteSignatory();

  const [draft, setDraft] = useState<SignatoryFormValues>(EMPTY_DRAFT);

  const rows = data?.rows ?? [];

  const handleAdd = async () => {
    if (!draft.name.trim()) {
      toast.error("Enter a signatory name");
      return;
    }
    try {
      await createSignatory.mutateAsync(draft);
      setDraft(EMPTY_DRAFT);
      toast.success("Signatory added");
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to add signatory");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Signatories"
        description="Doctors/labs whose signature can be selected when approving a test report."
      />

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Signature</TableHead>
              <TableHead>Passkey</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={FileText}
                    title="Couldn't load signatories"
                    description="Something went wrong. Please try again."
                    actionLabel="Retry"
                    onAction={() => refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((signatory) => (
                <TableRow key={signatory.id}>
                  <TableCell className="min-w-[160px]">
                    <Input
                      className="h-8"
                      defaultValue={signatory.name}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== signatory.name) {
                          updateSignatory.mutate({
                            id: signatory.id,
                            values: { name: e.target.value, title: signatory.title },
                          });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="min-w-[160px]">
                    <Input
                      className="h-8"
                      defaultValue={signatory.title ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (signatory.title ?? "")) {
                          updateSignatory.mutate({
                            id: signatory.id,
                            values: { name: signatory.name, title: e.target.value },
                          });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <SignatureUpload signatory={signatory} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={signatory.hasPasskey ? "success" : "outline"}>
                      {signatory.hasPasskey ? "Passkey set" : "No passkey"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={signatory.active}
                      onCheckedChange={(checked) =>
                        updateSignatory.mutate({
                          id: signatory.id,
                          values: { name: signatory.name, title: signatory.title, active: checked },
                        })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
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
                      title={`Delete "${signatory.name}"?`}
                      description="This signatory will no longer be selectable for new report approvals."
                      confirmLabel="Delete"
                      destructive
                      onConfirm={async () => {
                        try {
                          await deleteSignatory.mutateAsync(signatory.id);
                          toast.success(`${signatory.name} deleted`);
                        } catch (error) {
                          toast.error(
                            error instanceof ApiRequestError
                              ? error.message
                              : "Failed to delete signatory",
                          );
                          throw error;
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
            <TableRow>
              <TableCell>
                <Input
                  className="h-8"
                  placeholder="Dr. Jane Doe"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                />
              </TableCell>
              <TableCell>
                <Input
                  className="h-8"
                  placeholder="MD Pathology"
                  value={draft.title ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">Upload after adding</TableCell>
              <TableCell>
                <Input
                  className="h-8"
                  type="password"
                  placeholder="Optional passkey"
                  value={draft.passkey ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, passkey: e.target.value }))}
                />
              </TableCell>
              <TableCell />
              <TableCell className="text-right">
                <RippleButton
                  className="h-8 px-3"
                  onClick={handleAdd}
                  disabled={createSignatory.isPending}
                >
                  <Plus className="size-3.5" /> Add
                </RippleButton>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export { SignatoriesPage };

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { RippleButton } from "@/components/common/RippleButton";
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
import {
  useCreateTestParameter,
  useDeleteTestParameter,
  useReorderTestParameters,
  useTestParameters,
  useUpdateTestParameter,
} from "@/hooks/queries/useTestParameters";
import { ApiRequestError } from "@/services/api/ApiRequestError";
import type { TestParameterFormValues } from "@/types/test";

const EMPTY_DRAFT: TestParameterFormValues = {
  name: "",
  shortCode: "",
  unit: "",
  referenceRangeText: "",
  formula: "",
};

interface TestParametersEditorProps {
  testId: string;
}

function TestParametersEditor({ testId }: TestParametersEditorProps) {
  const { data: parameters, isLoading } = useTestParameters(testId);
  const createParameter = useCreateTestParameter(testId);
  const updateParameter = useUpdateTestParameter(testId);
  const deleteParameter = useDeleteTestParameter(testId);
  const reorderParameters = useReorderTestParameters(testId);

  const [draft, setDraft] = useState<TestParameterFormValues>(EMPTY_DRAFT);

  const rows = parameters ?? [];

  const handleAdd = async () => {
    if (!draft.name.trim()) {
      toast.error("Enter a parameter name");
      return;
    }
    try {
      await createParameter.mutateAsync(draft);
      setDraft(EMPTY_DRAFT);
    } catch (error) {
      toast.error(error instanceof ApiRequestError ? error.message : "Failed to add parameter");
    }
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const ordered = [...rows];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    reorderParameters.mutate(ordered.map((r) => r.id));
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Parameters
      </p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Short Code</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Reference Range</TableHead>
              <TableHead>Formula</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                  Loading parameters…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                  No parameters yet — this test reports a single free-text result.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((param, index) => (
                <TableRow key={param.id}>
                  <TableCell className="p-1">
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5"
                        disabled={index === 0}
                        onClick={() => handleMove(index, -1)}
                      >
                        <ArrowUp className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5"
                        disabled={index === rows.length - 1}
                        onClick={() => handleMove(index, 1)}
                      >
                        <ArrowDown className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    <Input
                      className="h-8"
                      defaultValue={param.name}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== param.name) {
                          updateParameter.mutate({
                            id: param.id,
                            values: { ...param, name: e.target.value },
                          });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="min-w-[100px]">
                    <Input
                      className="h-8"
                      defaultValue={param.shortCode ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (param.shortCode ?? "")) {
                          updateParameter.mutate({
                            id: param.id,
                            values: { ...param, shortCode: e.target.value },
                          });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="min-w-[90px]">
                    <Input
                      className="h-8"
                      defaultValue={param.unit ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (param.unit ?? "")) {
                          updateParameter.mutate({
                            id: param.id,
                            values: { ...param, unit: e.target.value },
                          });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    <Input
                      className="h-8"
                      defaultValue={param.referenceRangeText ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (param.referenceRangeText ?? "")) {
                          updateParameter.mutate({
                            id: param.id,
                            values: { ...param, referenceRangeText: e.target.value },
                          });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    <Input
                      className="h-8"
                      placeholder="e.g. (PCV*10)/RBC"
                      defaultValue={param.formula ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (param.formula ?? "")) {
                          updateParameter.mutate({
                            id: param.id,
                            values: { ...param, formula: e.target.value },
                          });
                        }
                      }}
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
                      title={`Delete "${param.name}"?`}
                      description="This parameter will no longer appear on this test's report entry form."
                      confirmLabel="Delete"
                      destructive
                      onConfirm={async () => {
                        try {
                          await deleteParameter.mutateAsync(param.id);
                          toast.success(`${param.name} deleted`);
                        } catch (error) {
                          toast.error(
                            error instanceof ApiRequestError
                              ? error.message
                              : "Failed to delete parameter",
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
              <TableCell />
              <TableCell>
                <Input
                  className="h-8"
                  placeholder="Hemoglobin"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                />
              </TableCell>
              <TableCell>
                <Input
                  className="h-8"
                  placeholder="HB"
                  value={draft.shortCode ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, shortCode: e.target.value }))}
                />
              </TableCell>
              <TableCell>
                <Input
                  className="h-8"
                  placeholder="g/dL"
                  value={draft.unit ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
                />
              </TableCell>
              <TableCell>
                <Input
                  className="h-8"
                  placeholder="13.5 - 17.5"
                  value={draft.referenceRangeText ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, referenceRangeText: e.target.value }))}
                />
              </TableCell>
              <TableCell>
                <Input
                  className="h-8"
                  placeholder="optional"
                  value={draft.formula ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, formula: e.target.value }))}
                />
              </TableCell>
              <TableCell className="text-right">
                <RippleButton
                  className="h-8 px-3"
                  onClick={handleAdd}
                  disabled={createParameter.isPending}
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

export { TestParametersEditor };

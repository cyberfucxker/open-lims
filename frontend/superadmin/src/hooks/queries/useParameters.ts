import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { downloadBlob } from "@/lib/downloadBlob";
import {
  createParameterApi,
  deleteParameterApi,
  exportParametersCsv,
  fetchParameters,
  importParametersCsv,
  removeParameterSampleReportApi,
  updateParameterApi,
  uploadParameterSampleReportApi,
  type ParameterFormValues,
  type ParameterListParams,
} from "@/services/api/parameterApi";

export function useParameters(params: ParameterListParams) {
  return useQuery({
    queryKey: ["parameters", params],
    queryFn: () => fetchParameters(params),
    placeholderData: (prev) => prev,
  });
}

/** Every parameter in one array, for the Test/Package pickers that must show
 *  ALL analytes — a single page is capped at 500 by the API but the catalogue
 *  holds more, so this pages through until the full set is loaded. Without it a
 *  test's attached parameters beyond the first page silently vanish from Edit. */
export function useAllParameters(params: Omit<ParameterListParams, "page" | "pageSize"> = {}) {
  return useQuery({
    queryKey: ["parameters", "all", params],
    queryFn: async () => {
      const PAGE = 500;
      const all: Awaited<ReturnType<typeof fetchParameters>>["rows"] = [];
      for (let page = 1; ; page++) {
        const res = await fetchParameters({ ...params, page, pageSize: PAGE });
        all.push(...res.rows);
        if (all.length >= res.total || res.rows.length === 0) break;
      }
      return all;
    },
    placeholderData: (prev) => prev,
  });
}

/** Every mutation below also invalidates `["tests"]` and `["packages"]`:
 *  a Test row shows its analytes' names and a Package's picker is filtered by
 *  `doTest`, so renaming a Parameter or flipping its Do Test toggle changes what
 *  those lists render. */
function useCatalogInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["parameters"] });
    queryClient.invalidateQueries({ queryKey: ["tests"] });
    queryClient.invalidateQueries({ queryKey: ["packages"] });
  };
}

export function useCreateParameter() {
  const invalidate = useCatalogInvalidation();
  return useMutation({
    mutationFn: (values: ParameterFormValues) => createParameterApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdateParameter() {
  const invalidate = useCatalogInvalidation();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ParameterFormValues }) =>
      updateParameterApi(id, values),
    onSuccess: invalidate,
  });
}

export function useDeleteParameter() {
  const invalidate = useCatalogInvalidation();
  return useMutation({
    mutationFn: (id: string) => deleteParameterApi(id),
    onSuccess: invalidate,
  });
}

export function useUploadParameterSampleReport() {
  const invalidate = useCatalogInvalidation();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      uploadParameterSampleReportApi(id, file),
    onSuccess: invalidate,
  });
}

export function useRemoveParameterSampleReport() {
  const invalidate = useCatalogInvalidation();
  return useMutation({
    mutationFn: (id: string) => removeParameterSampleReportApi(id),
    onSuccess: invalidate,
  });
}

export function useExportParametersCsv() {
  return useMutation({
    mutationFn: exportParametersCsv,
    onSuccess: (blob) => downloadBlob(blob, "parameters.csv"),
  });
}

export function useImportParametersCsv() {
  const invalidate = useCatalogInvalidation();
  return useMutation({
    mutationFn: (file: File) => importParametersCsv(file),
    onSuccess: invalidate,
  });
}

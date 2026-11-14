import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { downloadBlob } from "@/lib/downloadBlob";
import {
  createTestApi,
  deleteTestApi,
  exportTestsCsv,
  fetchTest,
  fetchTests,
  importTestsCsv,
  removeTestSampleReportApi,
  reorderTestParametersApi,
  setTestPopularApi,
  updateTestApi,
  uploadTestSampleReportApi,
  type TestFormValues,
  type TestListParams,
} from "@/services/api/testApi";

export function useTests(params: TestListParams) {
  return useQuery({
    queryKey: ["tests", params],
    queryFn: () => fetchTests(params),
    placeholderData: (prev) => prev,
  });
}

export function useTest(id: string | null) {
  return useQuery({
    queryKey: ["test", id],
    queryFn: () => fetchTest(id as string),
    enabled: !!id,
  });
}

/** A Test edit changes what its detail preview and any containing Package
 *  render, so those caches go too. */
function useTestInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["tests"] });
    queryClient.invalidateQueries({ queryKey: ["test"] });
    queryClient.invalidateQueries({ queryKey: ["test-detail"] });
    queryClient.invalidateQueries({ queryKey: ["packages"] });
    queryClient.invalidateQueries({ queryKey: ["package-detail"] });
  };
}

export function useCreateTest() {
  const invalidate = useTestInvalidation();
  return useMutation({
    mutationFn: (values: TestFormValues) => createTestApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdateTest() {
  const invalidate = useTestInvalidation();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TestFormValues }) =>
      updateTestApi(id, values),
    onSuccess: invalidate,
  });
}

export function useDeleteTest() {
  const invalidate = useTestInvalidation();
  return useMutation({
    mutationFn: (id: string) => deleteTestApi(id),
    onSuccess: invalidate,
  });
}

export function useSetTestPopular() {
  const invalidate = useTestInvalidation();
  return useMutation({
    mutationFn: ({ id, isPopular }: { id: string; isPopular: boolean }) =>
      setTestPopularApi(id, isPopular),
    onSuccess: invalidate,
  });
}

export function useReorderTestParameters() {
  const invalidate = useTestInvalidation();
  return useMutation({
    mutationFn: ({ id, orderedIds }: { id: string; orderedIds: string[] }) =>
      reorderTestParametersApi(id, orderedIds),
    onSuccess: invalidate,
  });
}

export function useUploadTestSampleReport() {
  const invalidate = useTestInvalidation();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadTestSampleReportApi(id, file),
    onSuccess: invalidate,
  });
}

export function useRemoveTestSampleReport() {
  const invalidate = useTestInvalidation();
  return useMutation({
    mutationFn: (id: string) => removeTestSampleReportApi(id),
    onSuccess: invalidate,
  });
}

export function useExportTestsCsv() {
  return useMutation({
    mutationFn: exportTestsCsv,
    onSuccess: (blob) => downloadBlob(blob, "tests.csv"),
  });
}

export function useImportTestsCsv() {
  const invalidate = useTestInvalidation();
  return useMutation({
    mutationFn: (file: File) => importTestsCsv(file),
    onSuccess: invalidate,
  });
}

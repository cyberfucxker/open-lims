import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { downloadBlob } from "@/lib/downloadBlob";
import {
  createPackageApi,
  deletePackageApi,
  exportPackagesCsv,
  fetchPackages,
  importPackagesCsv,
  removePackageSampleReportApi,
  setPackagePopularApi,
  setPackageStatusApi,
  updatePackageApi,
  uploadPackageSampleReportApi,
  type PackageFormValues,
  type PackageListParams,
} from "@/services/api/packageApi";

export function usePackages(params: PackageListParams) {
  return useQuery({
    queryKey: ["packages", params],
    queryFn: () => fetchPackages(params),
    placeholderData: (prev) => prev,
  });
}

/** A Package edit changes what its detail preview renders, so that cache goes
 *  too — same reasoning as `useTests.ts#useTestInvalidation`. */
function usePackageInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["packages"] });
    queryClient.invalidateQueries({ queryKey: ["package-detail"] });
  };
}

export function useCreatePackage() {
  const invalidate = usePackageInvalidation();
  return useMutation({
    mutationFn: (values: PackageFormValues) => createPackageApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdatePackage() {
  const invalidate = usePackageInvalidation();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PackageFormValues }) =>
      updatePackageApi(id, values),
    onSuccess: invalidate,
  });
}

export function useDeletePackage() {
  const invalidate = usePackageInvalidation();
  return useMutation({
    mutationFn: (id: string) => deletePackageApi(id),
    onSuccess: invalidate,
  });
}

export function useSetPackageStatus() {
  const invalidate = usePackageInvalidation();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setPackageStatusApi(id, active),
    onSuccess: invalidate,
  });
}

export function useSetPackagePopular() {
  const invalidate = usePackageInvalidation();
  return useMutation({
    mutationFn: ({ id, isPopular }: { id: string; isPopular: boolean }) =>
      setPackagePopularApi(id, isPopular),
    onSuccess: invalidate,
  });
}

export function useUploadPackageSampleReport() {
  const invalidate = usePackageInvalidation();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      uploadPackageSampleReportApi(id, file),
    onSuccess: invalidate,
  });
}

export function useRemovePackageSampleReport() {
  const invalidate = usePackageInvalidation();
  return useMutation({
    mutationFn: (id: string) => removePackageSampleReportApi(id),
    onSuccess: invalidate,
  });
}

export function useExportPackagesCsv() {
  return useMutation({
    mutationFn: exportPackagesCsv,
    onSuccess: (blob) => downloadBlob(blob, "packages.csv"),
  });
}

export function useImportPackagesCsv() {
  const invalidate = usePackageInvalidation();
  return useMutation({
    mutationFn: (file: File) => importPackagesCsv(file),
    onSuccess: invalidate,
  });
}

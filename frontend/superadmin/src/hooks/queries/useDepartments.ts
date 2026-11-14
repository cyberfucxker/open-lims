import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createDepartmentApi,
  deleteDepartmentApi,
  setDepartmentStatusApi,
  updateDepartmentApi,
  type DepartmentFormValues,
} from "@/services/api/departmentApi";

/** Read hooks for the department LIST itself live in `useMasterData.ts`
 *  (`useDepartments`) — the Category taxonomy already reads it from there, so
 *  this module adds only the writes. */

/** A department edit changes what Category rows report as their department,
 *  so that cache goes too. */
function useDepartmentInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["departments"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };
}

export function useCreateDepartment() {
  const invalidate = useDepartmentInvalidation();
  return useMutation({
    mutationFn: (values: DepartmentFormValues) => createDepartmentApi(values),
    onSuccess: invalidate,
  });
}

export function useUpdateDepartment() {
  const invalidate = useDepartmentInvalidation();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: DepartmentFormValues }) =>
      updateDepartmentApi(id, values),
    onSuccess: invalidate,
  });
}

export function useDeleteDepartment() {
  const invalidate = useDepartmentInvalidation();
  return useMutation({
    mutationFn: (id: string) => deleteDepartmentApi(id),
    onSuccess: invalidate,
  });
}

export function useSetDepartmentStatus() {
  const invalidate = useDepartmentInvalidation();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setDepartmentStatusApi(id, active),
    onSuccess: invalidate,
  });
}

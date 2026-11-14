import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveReportApi,
  approveTestResultApi,
  cancelReportApi,
  fetchReport,
  fetchReportByAppointment,
  fetchReportHistory,
  fetchReports,
  markReportPrintedApi,
  rejectReportApi,
  rejectTestResultApi,
  saveResultsApi,
  saveTestResultApi,
  submitReportApi,
  submitTestResultApi,
} from "@/services/api/report.api";
import type {
  ApproveTestResultInput,
  CancelReportInput,
  ListReportsParams,
  RejectReportInput,
  RejectTestResultInput,
  SaveResultsInput,
  SaveTestResultInput,
} from "@/types/report";

export function useReports(params: ListReportsParams) {
  return useQuery({
    queryKey: ["reports", params],
    queryFn: () => fetchReports(params),
    placeholderData: (prev) => prev,
  });
}

export function useReportDetails(id: string | null) {
  return useQuery({
    queryKey: ["reports", "detail", id],
    queryFn: () => fetchReport(id as string),
    enabled: Boolean(id),
  });
}

export function useReportByAppointment(appointmentId: string | null) {
  return useQuery({
    queryKey: ["reports", "by-appointment", appointmentId],
    queryFn: () => fetchReportByAppointment(appointmentId as string),
    enabled: Boolean(appointmentId),
  });
}

export function useReportHistory(id: string | null) {
  return useQuery({
    queryKey: ["reports", "history", id],
    queryFn: () => fetchReportHistory(id as string),
    enabled: Boolean(id),
  });
}

function invalidateReport(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  queryClient.invalidateQueries({ queryKey: ["reports"] });
  queryClient.invalidateQueries({ queryKey: ["reports", "detail", id] });
  queryClient.invalidateQueries({ queryKey: ["appointments"] });
}

export function useSaveResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SaveResultsInput }) =>
      saveResultsApi(id, input),
    onSuccess: (_data, { id }) => invalidateReport(queryClient, id),
  });
}

export function useSaveTestResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      resultId,
      input,
    }: {
      reportId: string;
      resultId: string;
      input: SaveTestResultInput;
    }) => saveTestResultApi(reportId, resultId, input),
    onSuccess: (_data, { reportId }) => invalidateReport(queryClient, reportId),
  });
}

export function useSubmitTestResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, resultId }: { reportId: string; resultId: string }) =>
      submitTestResultApi(reportId, resultId),
    onSuccess: (_data, { reportId }) => invalidateReport(queryClient, reportId),
  });
}

export function useApproveTestResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      resultId,
      input,
    }: {
      reportId: string;
      resultId: string;
      input: ApproveTestResultInput;
    }) => approveTestResultApi(reportId, resultId, input),
    onSuccess: (_data, { reportId }) => invalidateReport(queryClient, reportId),
  });
}

export function useRejectTestResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      resultId,
      input,
    }: {
      reportId: string;
      resultId: string;
      input: RejectTestResultInput;
    }) => rejectTestResultApi(reportId, resultId, input),
    onSuccess: (_data, { reportId }) => invalidateReport(queryClient, reportId),
  });
}

export function useSubmitReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => submitReportApi(id),
    onSuccess: (_data, id) => invalidateReport(queryClient, id),
  });
}

export function useApproveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveReportApi(id),
    onSuccess: (_data, id) => invalidateReport(queryClient, id),
  });
}

export function useRejectReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RejectReportInput }) =>
      rejectReportApi(id, input),
    onSuccess: (_data, { id }) => invalidateReport(queryClient, id),
  });
}

export function useCancelReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CancelReportInput }) =>
      cancelReportApi(id, input),
    onSuccess: (_data, { id }) => invalidateReport(queryClient, id),
  });
}

export function useMarkReportPrinted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markReportPrintedApi(id),
    onSuccess: (_data, id) => invalidateReport(queryClient, id),
  });
}

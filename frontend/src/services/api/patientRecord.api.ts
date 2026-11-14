import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  ListPatientRecordsParams,
  ListPatientRecordsResult,
  PatientRecord,
  RegisterPatientRecordInput,
  RegisterPatientRecordResult,
} from "@/types/patientRecord";

export async function fetchPatientRecords(
  params: ListPatientRecordsParams = {},
): Promise<ListPatientRecordsResult> {
  const response = await httpClient.get<ApiResponseBody<ListPatientRecordsResult>>("/patients", {
    params,
  });
  return response.data.data as ListPatientRecordsResult;
}

export async function fetchPatientRecord(id: string): Promise<PatientRecord> {
  const response = await httpClient.get<ApiResponseBody<PatientRecord>>(`/patients/${id}`);
  return response.data.data as PatientRecord;
}

export async function registerPatientRecordApi(
  input: RegisterPatientRecordInput,
): Promise<RegisterPatientRecordResult> {
  const response = await httpClient.post<ApiResponseBody<RegisterPatientRecordResult>>(
    "/patients",
    input,
  );
  return response.data.data as RegisterPatientRecordResult;
}

export async function fetchPatientRecordBarcode(
  id: string,
): Promise<{ patientId: string; barcodeImage: string }> {
  const response = await httpClient.get<
    ApiResponseBody<{ patientId: string; barcodeImage: string }>
  >(`/patients/${id}/barcode`);
  return response.data.data as { patientId: string; barcodeImage: string };
}

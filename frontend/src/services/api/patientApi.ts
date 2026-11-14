import { httpClient } from "@/services/api/httpClient";
import type { ApiResponseBody } from "@/types/api";
import type {
  ListPatientsParams,
  ListPatientsResult,
  Patient,
  PatientFormValues,
} from "@/types/patient";

/** Real `/patients` endpoints. Param names mirror the mock service so a
 *  backend that follows the same convention needs no frontend changes. */
export async function fetchPatients(params: ListPatientsParams = {}): Promise<ListPatientsResult> {
  const response = await httpClient.get<ApiResponseBody<ListPatientsResult>>("/patients", {
    params,
    suppressErrorToast: true,
  });
  return response.data.data as ListPatientsResult;
}

export async function fetchPatient(id: string): Promise<Patient> {
  const response = await httpClient.get<ApiResponseBody<Patient>>(`/patients/${id}`, {
    suppressErrorToast: true,
  });
  return response.data.data as Patient;
}

export async function createPatientApi(
  values: PatientFormValues,
  testIds: string[],
): Promise<Patient> {
  const response = await httpClient.post<ApiResponseBody<Patient>>(
    "/patients",
    { ...values, testIds },
    { suppressErrorToast: true },
  );
  return response.data.data as Patient;
}

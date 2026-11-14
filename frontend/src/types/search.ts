export interface GlobalSearchPatientResult {
  id: string;
  patientId: string;
  fullName: string;
  mobile: string;
}

export interface GlobalSearchTestResult {
  id: string;
  name: string;
  shortName: string;
  price: number;
}

export interface GlobalSearchResult {
  patients: GlobalSearchPatientResult[];
  tests: GlobalSearchTestResult[];
}

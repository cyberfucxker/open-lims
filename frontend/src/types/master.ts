export interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentFormValues {
  name: string;
  code?: string;
  description?: string;
  active: boolean;
}

export interface Category {
  id: string;
  departmentId: string;
  department: string;
  name: string;
  code: string | null;
  description: string | null;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormValues {
  departmentId: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
}

export interface SampleType {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SampleTypeFormValues {
  name: string;
  description?: string;
  active: boolean;
}

export interface ListMasterParams {
  search?: string;
  active?: string;
  includeDeleted?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ListCategoriesParams extends ListMasterParams {
  departmentId?: string;
}

export interface ListDepartmentsResult {
  rows: Department[];
  total: number;
}

export interface ListCategoriesResult {
  rows: Category[];
  total: number;
}

export interface ListSampleTypesResult {
  rows: SampleType[];
  total: number;
}

export interface Center {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CenterFormValues {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  active: boolean;
}

export interface ListCentersResult {
  rows: Center[];
  total: number;
}

/** Specimen container master (e.g. EDTA Tube, Plain Tube) — Sample Collection
 *  module's own masters, separate from the (already-complete) Sample Type module. */
export interface Container {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
  description: string | null;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContainerFormValues {
  name: string;
  code?: string;
  color?: string;
  description?: string;
  active: boolean;
}

export interface ListContainersResult {
  rows: Container[];
  total: number;
}

export type TemperatureRequirement =
  "ROOM_TEMPERATURE" | "REFRIGERATED_2_8" | "FROZEN_MINUS20" | "FROZEN_MINUS80";

/** 1:1 collection-rule extension of a catalogue Test — `rule` is null until
 *  an admin configures one for that test. */
export interface TestSampleRule {
  testId: string;
  testName: string;
  testShortName: string;
  sampleType: string;
  rule: {
    containerId: string | null;
    containerName: string | null;
    requiresFasting: boolean;
    fastingHours: number | null;
    isStatAllowed: boolean;
    temperatureRequirement: TemperatureRequirement;
    minVolumeMl: number | null;
    volumeUnit: string;
    preparationInstructions: string | null;
    collectionInstructions: string | null;
    postCollectionInstructions: string | null;
    updatedAt: string;
  } | null;
}

export interface TestSampleRuleFormValues {
  containerId?: string;
  requiresFasting: boolean;
  fastingHours?: number;
  isStatAllowed: boolean;
  temperatureRequirement: TemperatureRequirement;
  minVolumeMl?: number;
  volumeUnit: string;
  preparationInstructions?: string;
  collectionInstructions?: string;
  postCollectionInstructions?: string;
}

export interface ListTestSampleRulesParams {
  search?: string;
  departmentId?: string;
  categoryId?: string;
  sampleTypeId?: string;
  configured?: string;
  page?: number;
  pageSize?: number;
}

export interface ListTestSampleRulesResult {
  rows: TestSampleRule[];
  total: number;
}

/** 1:1 auto-generation barcode settings for an existing Sample Type — every
 *  Sample Type needs one before samples of that type can be collected. */
export interface SampleTypeBarcodeConfig {
  sampleTypeId: string;
  sampleTypeName: string;
  prefix: string | null;
  numberLength: number;
  active: boolean;
  updatedAt: string | null;
}

export interface SampleTypeBarcodeConfigFormValues {
  prefix: string;
  numberLength: number;
  active: boolean;
}

export interface ListSampleTypeBarcodeConfigsResult {
  rows: SampleTypeBarcodeConfig[];
  total: number;
}

/** 1:1 Report Entry defaults for a catalogue Test (unit/method/critical values). */
export interface TestResultConfig {
  testId: string;
  testName: string;
  testShortName: string;
  config: {
    unit: string | null;
    method: string | null;
    criticalLow: number | null;
    criticalHigh: number | null;
    decimalPrecision: number;
    updatedAt: string;
  } | null;
}

export interface TestResultConfigFormValues {
  unit?: string;
  method?: string;
  criticalLow?: number;
  criticalHigh?: number;
  decimalPrecision: number;
}

export interface ListTestResultConfigsParams {
  search?: string;
  departmentId?: string;
  categoryId?: string;
  configured?: string;
  page?: number;
  pageSize?: number;
}

export interface ListTestResultConfigsResult {
  rows: TestResultConfig[];
  total: number;
}

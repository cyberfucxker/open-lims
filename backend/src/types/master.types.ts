/** Shared shapes for the Department / Category / SampleType master-data
 *  modules — each is a small soft-deletable, searchable, paginated list. */
export interface ListMasterParams {
  search?: string;
  active?: string;
  includeDeleted?: string;
  sortBy?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

export interface DepartmentDto {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentWriteData {
  name: string;
  code?: string | null;
  description?: string | null;
  active?: boolean;
}

export interface ListDepartmentsResult {
  rows: DepartmentDto[];
  total: number;
}

export interface CenterDto {
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

export interface CenterWriteData {
  name: string;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  active?: boolean;
}

export interface ListCentersResult {
  rows: CenterDto[];
  total: number;
}

export interface CategoryDto {
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

export interface CategoryWriteData {
  departmentId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  active?: boolean;
}

export interface ListCategoriesParams extends ListMasterParams {
  departmentId?: string;
}

export interface ListCategoriesResult {
  rows: CategoryDto[];
  total: number;
}

export interface SampleTypeDto {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SampleTypeWriteData {
  name: string;
  description?: string | null;
  active?: boolean;
}

export interface ListSampleTypesResult {
  rows: SampleTypeDto[];
  total: number;
}

/// A state a City belongs to — read-only from Superadmin (already seeded),
/// just enough to populate the City form's State picker.
export interface StateDto {
  id: string;
  name: string;
  code: string | null;
  /** How many cities sit under it — the States tab shows this, and it is the
   *  reason a state is never deleted once it has any. */
  cityCount: number;
}

export interface StateWriteData {
  name: string;
  code?: string | null;
}

/** The patient-app-facing city master — drives the location picker, the
 *  `/{citySlug}`, `/tests/{citySlug}`, `/packages/{citySlug}` SEO routes,
 *  and (once created/edited/deactivated) a live sitemap regeneration — see
 *  `shadowTest.service.ts`'s sibling, `sitemapGenerator.service.ts`.
 *  `isActive: false` is how a city is "removed" — `City` has no soft-delete
 *  `deletedAt` column, and a real delete would hit the FK `Restrict`/data
 *  every AppUser/Prescription/Organization/Area/Phlebotomist already
 *  pointing at it once the city has any real activity. */
export interface CityDto {
  id: string;
  name: string;
  slug: string;
  stateId: string;
  stateName: string;
  isActive: boolean;
  isFeatured: boolean;
}

export interface CityWriteData {
  name: string;
  stateId: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface ListCitiesResult {
  rows: CityDto[];
  total: number;
}

/** Specimen container master (e.g. EDTA Tube, Plain Tube) — Sample Collection
 *  module's masters, separate from the (already-complete) Sample Type module. */
export interface ContainerDto {
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

export interface ContainerWriteData {
  name: string;
  code?: string | null;
  color?: string | null;
  description?: string | null;
  active?: boolean;
}

export interface ListContainersResult {
  rows: ContainerDto[];
  total: number;
}

export type TemperatureRequirement =
  "ROOM_TEMPERATURE" | "REFRIGERATED_2_8" | "FROZEN_MINUS20" | "FROZEN_MINUS80";

/** 1:1 collection-rule extension of a catalogue Test — never modifies the
 *  `tests` table itself. `rule` is null until an admin configures one. */
export interface TestSampleRuleDto {
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

export interface TestSampleRuleWriteData {
  containerId?: string | null;
  requiresFasting?: boolean;
  fastingHours?: number | null;
  isStatAllowed?: boolean;
  temperatureRequirement?: TemperatureRequirement;
  minVolumeMl?: number | null;
  volumeUnit?: string;
  preparationInstructions?: string | null;
  collectionInstructions?: string | null;
  postCollectionInstructions?: string | null;
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
  rows: TestSampleRuleDto[];
  total: number;
}

/** 1:1 auto-generation barcode settings for an existing Sample Type — every
 *  Sample Type needs one of these before samples of that type can be
 *  collected (see `idGenerator.ts#nextSampleNo`). */
export interface SampleTypeBarcodeConfigDto {
  sampleTypeId: string;
  sampleTypeName: string;
  prefix: string | null;
  numberLength: number;
  active: boolean;
  updatedAt: string | null;
}

export interface SampleTypeBarcodeConfigWriteData {
  prefix: string;
  numberLength?: number;
  active?: boolean;
}

export interface ListSampleTypeBarcodeConfigsResult {
  rows: SampleTypeBarcodeConfigDto[];
  total: number;
}

/** 1:1 Report Entry defaults for a catalogue Test (unit/method/critical
 *  values) — owned from Report Settings, kept separate from TestSampleRule. */
export interface TestResultConfigDto {
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

export interface TestResultConfigWriteData {
  unit?: string | null;
  method?: string | null;
  criticalLow?: number | null;
  criticalHigh?: number | null;
  decimalPrecision?: number;
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
  rows: TestResultConfigDto[];
  total: number;
}

/** Admin-facing DTO for the app's booking `Slot` model.
 *
 *  IMPORTANT scope note (confirmed, not a bug): `src/services/app/slot.service.ts`
 *  (the live patient-app read path) only ever queries `Slot` rows where
 *  `centerId: null` for a given date. A slot created here with a real
 *  `centerId` will persist and be manageable from this admin module, but it
 *  is currently INVISIBLE to the app until the app's read side gets
 *  city/center scoping wired up. `centerId: null` is what makes a slot
 *  actually bookable today.
 *
 *  `isBlocked` here is the RAW admin-set flag. The app instead exposes a
 *  single derived boolean (`isBlocked || bookedCount >= capacity`) to
 *  patients, so "manually blocked" and "full" look identical from the app's
 *  point of view — `computedFull` lets the admin tell the two apart.
 */
export interface AppSlotDto {
  id: string;
  centerId: string | null;
  slotDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  capacity: number;
  bookedCount: number;
  surchargeAmount: number;
  isBlocked: boolean;
  computedFull: boolean;
}

export interface ListAppSlotsParams {
  dateFrom: string;
  dateTo: string;
  centerId?: string;
  isBlocked?: string;
}

export interface AppSlotWriteData {
  centerId?: string | null;
  slotDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  surchargeAmount?: number;
  isBlocked?: boolean;
}

export interface BulkApplySlotBucket {
  startTime: string;
  endTime: string;
  capacity: number;
  surchargeAmount?: number;
}

export interface BulkApplySlotsData {
  dateFrom: string;
  dateTo: string;
  weekdays: number[];
  centerId?: string | null;
  buckets: BulkApplySlotBucket[];
}

export interface BulkApplyResult {
  createdCount: number;
  skippedCount: number;
}

export interface ServiceCenterOptionDto {
  id: string;
  name: string;
}

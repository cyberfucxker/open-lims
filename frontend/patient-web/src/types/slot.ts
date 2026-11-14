export interface SlotItem {
  slot_id: string;
  title: string;
  isBlocked: boolean;
  blockReason: string | null;
}

export interface SlotAvailabilityResult {
  city: string | null;
  date: string;
  slots: SlotItem[];
}

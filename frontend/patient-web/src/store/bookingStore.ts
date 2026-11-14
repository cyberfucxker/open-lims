import { create } from "zustand";

interface BookingState {
  selectedAddressId: string | null;
  selectedFamilyMemberId: string | null;
  selectedDate: string | null;
  selectedSlotId: string | null;
  selectedSlotTitle: string | null;
  setAddress: (id: string) => void;
  setFamilyMember: (id: string) => void;
  setSlot: (date: string, slotId: string, slotTitle: string) => void;
  reset: () => void;
}

const initialState = {
  selectedAddressId: null,
  selectedFamilyMemberId: null,
  selectedDate: null,
  selectedSlotId: null,
  selectedSlotTitle: null,
};

export const useBookingStore = create<BookingState>()((set) => ({
  ...initialState,
  setAddress: (id) => set({ selectedAddressId: id }),
  setFamilyMember: (id) => set({ selectedFamilyMemberId: id }),
  setSlot: (date, slotId, slotTitle) =>
    set({ selectedDate: date, selectedSlotId: slotId, selectedSlotTitle: slotTitle }),
  reset: () => set(initialState),
}));

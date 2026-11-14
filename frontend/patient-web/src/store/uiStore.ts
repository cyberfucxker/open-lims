import { create } from "zustand";

interface UiState {
  activeFamilyMemberId: string;
  setActiveFamilyMemberId: (id: string) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  activeFamilyMemberId: "fm_self",
  setActiveFamilyMemberId: (id) => set({ activeFamilyMemberId: id }),
}));

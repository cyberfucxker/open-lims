import { create } from "zustand";

interface CartState {
  itemCount: number;
  setItemCount: (count: number) => void;
  /** Bumped on every add-to-cart so listeners (e.g. the tab-bar badge) can play a
   *  one-shot "pop" animation instead of re-animating on every unrelated re-render. */
  lastAddedAt: number;
  bumpLastAdded: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  itemCount: 0,
  setItemCount: (count) => set({ itemCount: count }),
  lastAddedAt: 0,
  bumpLastAdded: () => set({ lastAddedAt: Date.now() }),
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

const initialTheme: Theme = window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";
applyThemeClass(initialTheme);

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: initialTheme,
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        applyThemeClass(next);
        set({ theme: next });
      },
      setTheme: (theme) => {
        applyThemeClass(theme);
        set({ theme });
      },
    }),
    {
      name: "openlims-superadmin-theme",
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeClass(state.theme);
      },
    },
  ),
);

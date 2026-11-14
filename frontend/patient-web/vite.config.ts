import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    port: 3200,
    // Vite refuses requests whose Host header it doesn't recognise — needed
    // so the dev server is reachable through a devtunnels.ms forwarded port,
    // not just localhost. Dev-only; the production build never runs this.
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/react-router-dom|\/react-dom\/|\/react\//.test(id)) return "react-vendor";
          if (id.includes("@radix-ui")) return "radix-vendor";
          if (/framer-motion/.test(id)) return "viz-vendor";
          if (id.includes("@tanstack")) return "query-vendor";
          return "vendor";
        },
      },
    },
  },
});

import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    // Split large, rarely-changing vendor libs into their own chunks so a
    // deploy that only touches app code doesn't invalidate the CloudFront
    // cache for React/Radix/etc. — those chunks keep the same hash across
    // releases and stay cached in returning users' browsers.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/react-router-dom|\/react-dom\/|\/react\//.test(id)) return "react-vendor";
          if (id.includes("@radix-ui")) return "radix-vendor";
          if (/recharts|framer-motion/.test(id)) return "viz-vendor";
          if (id.includes("@tanstack")) return "query-vendor";
          return "vendor";
        },
      },
    },
  },
});

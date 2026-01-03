import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: "assets/chunk-[hash].js",
        chunkFileNames: "assets/chunk-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",

        manualChunks(id) {
          if (id.includes("/src/pages/")) return `chunk-pages-[hash]`;

          // Big libraries
          if (id.includes("firebase")) return `chunk-firebase-[hash]`;
          if (id.includes("recharts")) return `chunk-charts-[hash]`;
          if (id.includes("framer-motion")) return `chunk-motion-[hash]`;

          // Merge all small helpers/components into one chunk
          if (
            id.includes("Navbar") ||
            id.includes("Footer") ||
            id.includes("TitleUpdater") ||
            id.includes("FaviconUpdater") ||
            id.includes("Toaster") ||
            id.includes("Auth")
          )
            return `chunk-utils-[hash]`;
        },
      },
    },
  },
});

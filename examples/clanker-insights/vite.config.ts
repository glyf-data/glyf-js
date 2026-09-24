import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    // Vega is most of the bundle; one chunk for it keeps the app's own small.
    rollupOptions: {
      output: {
        manualChunks: { vega: ["vega", "vega-lite", "vega-embed"] },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
});

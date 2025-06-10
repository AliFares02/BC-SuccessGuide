import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true, // Clears dist folder on each build
  },
  base: "./", // Critical for static asset paths
  server: {
    port: 5173, // Default Vite dev server port
  },
  define: {
    // Forward environment variables to client
    "process.env": process.env,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // This tells Vite the index.html is in the same folder as this config file
  root: process.cwd(), 
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./client/src"),
    },
  },
  build: {
    outDir: "dist/public",
    emptyOutDir: false, // Prevents Vite from deleting the server build
  },
});

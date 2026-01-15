import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "./", 
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      // Points to your frontend src
      "@": path.resolve(__dirname, "./src"),
      // Points to your shared folder (verify this path matches your folder structure)
      "@shared": path.resolve(__dirname, "./shared"), 
    },
  },
});

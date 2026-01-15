import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // This tells Vite the project starts at the root where index.html is
  root: "./", 
  build: {
    outDir: "dist", // Simplified for Vercel
    emptyOutDir: true, // Clean the folder before building
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Fixed: removed /client
    },
  },
});

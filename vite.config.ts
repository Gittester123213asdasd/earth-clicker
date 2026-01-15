import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // This tells Vite that while the config is in root, 
  // the project logic is inside the 'client' folder.
  root: path.resolve(__dirname), 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
  build: {
    outDir: "dist/public",
    emptyOutDir: false, // Important: prevents Vite from deleting your server build
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    },
  },
});

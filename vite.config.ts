import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(fileURLToPath(new URL(".", import.meta.url)), "client", "src"),
      "@shared": path.resolve(fileURLToPath(new URL(".", import.meta.url)), "shared"),
      "@assets": path.resolve(fileURLToPath(new URL(".", import.meta.url)), "attached_assets"),
    },
  },
  root: path.resolve(fileURLToPath(new URL(".", import.meta.url)), "client"),
  build: {
    outDir: path.resolve(fileURLToPath(new URL(".", import.meta.url)), "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});

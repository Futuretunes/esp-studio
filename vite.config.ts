import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { githubAssetProxyPlugin } from "./vite.github-asset-proxy";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Relative asset URLs so static hosts / subfolders do not 404 /assets/*
  // (absolute "/assets/..." causes a blank white page when not at domain root).
  base: "./",
  plugins: [react(), tailwindcss(), githubAssetProxyPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});

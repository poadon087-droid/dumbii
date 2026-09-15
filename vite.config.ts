import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import fs from "fs";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** The distributable is `index.html`, not `dev.html`: GitHub Pages serves `dist/index.html`, and
 *  the in-app preview opens the file at the repo root. Doing this inside the build (instead of a
 *  `cp` in an npm script) means no runner, CI job or Windows shell can skip a step and ship a 404. */
function shipAsIndexHtml(): Plugin {
  return {
    name: "rr:ship-index-html",
    apply: "build",
    closeBundle() {
      const src = path.resolve(__dirname, "dist/dev.html");
      if (!fs.existsSync(src)) return;
      const html = fs.readFileSync(src);
      fs.writeFileSync(path.resolve(__dirname, "dist/index.html"), html);
      fs.writeFileSync(path.resolve(__dirname, "index.html"), html);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), shipAsIndexHtml()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // The dev entry lives in dev.html; the shipAsIndexHtml plugin copies the inlined result to
    // dist/index.html and index.html. One source of truth, no post-build shell step.
    rollupOptions: { input: path.resolve(__dirname, "dev.html") },
  },
  server: {
    host: "0.0.0.0",
    // Accept any origin: this is a static single-file build served for previewing.
    allowedHosts: true,
    // The live preview is embedded as a sandboxed iframe with an opaque (null)
    // origin. Without CORS headers the browser blocks every module fetch and
    // the page stays blank. Serve modules to any origin, including null.
    cors: true,
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

// Plugin to return 404 for missing model files instead of falling back to index.html
function serveModelsAs404() {
  return {
    name: "serve-models-as-404",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith("/models/")) {
          const cleanUrl = req.url.split("?")[0];
          const filePath = path.join(server.config.root, "public", cleanUrl);
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404;
            res.end("Not Found");
            return;
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind v4 — uses @tailwindcss/vite instead of PostCSS
    serveModelsAs404(),
  ],
  optimizeDeps: {
    exclude: ["@huggingface/transformers"],
  },
  worker: {
    format: "es",
  },
  build: {
    target: "esnext",
  },
  server: {
    headers: {
      // Required for SharedArrayBuffer used by ONNX Runtime WASM threading
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
